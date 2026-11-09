import { DV, F32, U16, U32, U8 } from "../engine/typed-arrays.js";
import { mat4Determinant3 } from "../math/mat4-determinant3.js";
import { BU } from "../engine/gpu-flags.js";
import { createMappedBuffer } from "../resource/mapped-buffer.js";
import { getOrCreateSampler } from "../resource/texture-sampler-pool.js";
import { createSceneNodeFromMatrix } from "../scene/scene-node.js";
import { initMeshTransform } from "../mesh/mesh.js";
import { computeAabb } from "../math/compute-aabb.js";
import { createTransformNode } from "../scene/transform-node.js";
import { TYPE_SIZES, anyPrimitive, buildParentMap, computeNodeWorldMatrix, needsOrmComposite, resolveAccessor } from "./gltf-parser.js";
import { assembleMaterial, makeImageFetcher } from "./gltf-material.js";
import { applyGltfOptInPbrFeatures, assemblePbrProps, buildDefaultPbrTextures, identityTexWrap, uploadTex } from "./gltf-pbr-builder.js";
import { _appendEnabledGltfFeatures } from "./gltf-feature-hooks.js";
import { _rightHanded } from "#coordinate-system";
// src/loader-gltf/load-gltf.ts
var _interleavePromise;
function loadInterleave() {
	return _interleavePromise ??= import("./gltf-interleave.js");
}
var _gltfFeatureRegistryPromise;
function importGltfFeatureRegistry() {
	return _gltfFeatureRegistryPromise ??= import("./gltf-feature-registry.js");
}
var _colorNormalizePromise;
function importColorNormalize() {
	return _colorNormalizePromise ??= import("./gltf-color-normalize.js");
}
/** Build one tightly-packed glTF mesh, optionally reusing a prior instance's
* immutable CPU/GPU geometry. Instance state and object-local bounds stay unique. */
function buildTightGltfMesh(engine, meshData, material, name, source) {
	const [boundMin, boundMax] = computeAabb(meshData._positions);
	const indices = meshData._indices;
	const uint32 = indices instanceof U32;
	const gpu = source ? source._gpu : {
		positionBuffer: createMappedBuffer(engine, meshData._positions, BU.VERTEX),
		normalBuffer: createMappedBuffer(engine, meshData._normals, BU.VERTEX),
		tangentBuffer: meshData._tangents ? createMappedBuffer(engine, meshData._tangents, BU.VERTEX) : null,
		uvBuffer: createMappedBuffer(engine, meshData._uvs, BU.VERTEX),
		uv2Buffer: meshData._uv2s ? createMappedBuffer(engine, meshData._uv2s, BU.VERTEX) : null,
		colorBuffer: meshData._colors ? createMappedBuffer(engine, meshData._colors, BU.VERTEX) : null,
		indexBuffer: createMappedBuffer(engine, indices, BU.INDEX),
		indexCount: meshData._indexCount,
		indexFormat: uint32 ? "uint32" : "uint16"
	};
	const mesh = initMeshTransform({
		name,
		material,
		receiveShadows: false,
		boundMin,
		boundMax,
		_gpu: gpu,
		_flatNormal: meshData._flatNormal
	});
	mesh._cpuPositions = meshData._positions;
	mesh._cpuNormals = meshData._normals;
	mesh._cpuUvs = meshData._uvs;
	mesh._cpuIndices = source ? source._cpuIndices : uint32 ? indices : new U32(indices);
	engine._dlr?.m(mesh, meshData._uv2s, meshData._tangents, meshData._colors, indices, gpu.indexFormat);
	return mesh;
}
/**
* Load a glTF/GLB asset, parse it, and upload mesh + material data to GPU.
* Registers a deferred PBR renderable builder and automatically parses glTF
* animations if present.
*
* Returns an {@link AssetContainer}. Pass it to {@link addToScene} which adds the
* hierarchy, registers animation ticks, and applies any scene-level settings.
*
* The `source` may be either:
* - **A URL (`string`)** — fetches the asset. Supports both binary GLB and
*   separate `.gltf` + `.bin` + image files; relative `.bin`/image paths are
*   resolved against non-`blob:`/`data:` URLs. `blob:` and `data:` URL strings
*   have no directory base, so they must be self-contained like raw data.
* - **Raw data (`ArrayBuffer` | `Blob`)** — loads from already-loaded local data
*   (drag-and-drop, OPFS, a `fetch` body, etc.). GLB-vs-glTF is determined from
*   the data's magic bytes, not a file extension. Because raw data has no base
*   URL it must be self-contained: a GLB, or a glTF whose buffers/images use
*   `data:` URIs. A glTF that references external `.bin`/image files by relative
*   path can only be loaded from a URL.
*
* @param engine - The engine to upload GPU resources to.
* @param source - A URL string, or the raw `ArrayBuffer`/`Blob` of a self-contained glTF/GLB asset.
*/
async function loadGltf(engine, source) {
	const { json, binChunk, baseUrl } = await fetchGltfAsset(source);
	const parentMap = buildParentMap(json);
	const worldMatrixCache = /* @__PURE__ */ new Map();
	const featureRegistry = assetUsesGltfFeatures(json) ? await importGltfFeatureRegistry() : void 0;
	const features = featureRegistry ? await featureRegistry.loadGltfFeatures(json) : [];
	_appendEnabledGltfFeatures(json, features);
	let activeBin = binChunk;
	for (const f of features) if (f.preParse) {
		const replacement = await f.preParse(json, activeBin);
		if (replacement) activeBin = replacement;
	}
	const matExts = features.filter((f) => f.applyMaterial);
	const texWraps = features.filter((f) => f.wrapTexture).map((f) => f.wrapTexture);
	const wrapTex = !texWraps.length ? identityTexWrap : (tex, ti) => texWraps.reduce((acc, w) => w(acc, ti), tex);
	const decodedPrimitives = /* @__PURE__ */ new Map();
	for (const frag of await Promise.all(features.flatMap((f) => f.preMesh ? [f.preMesh(json, activeBin, baseUrl)] : []))) for (const [k, v] of frag) decodedPrimitives.set(k, v);
	const meshDatas = await extractAllMeshes(json, activeBin, baseUrl, parentMap, worldMatrixCache, decodedPrimitives);
	const ctx = {
		_engine: engine,
		_json: json,
		_binChunk: activeBin,
		_baseUrl: baseUrl,
		_parentMap: parentMap,
		_worldMatrixCache: worldMatrixCache,
		_matExts: matExts,
		_runMatExts: featureRegistry?.runGltfMaterialFeatures,
		_wrapTex: wrapTex
	};
	const meshes = await uploadMeshes(meshDatas, features, ctx);
	const { root, nodeMap } = buildNodeHierarchy(json, meshes, meshDatas);
	ctx._nodeMap = nodeMap;
	const assetFragments = await Promise.all(features.flatMap((f) => f.applyAsset ? [f.applyAsset(meshes, root, ctx)] : []));
	const container = { entities: [root] };
	for (const frag of assetFragments) {
		if (frag.entities?.length) container.entities.push(...frag.entities);
		const { entities: _ignored, _sceneSetup, ...rest } = frag;
		Object.assign(container, rest);
		if (_sceneSetup) {
			const prev = container._sceneSetup;
			container._sceneSetup = (scene, target) => {
				prev?.(scene, target);
				_sceneSetup(scene, target);
			};
		}
	}
	return container;
}
/** Fetch/resolve + parse a glTF or GLB asset from a URL string, ArrayBuffer, or Blob.
*  Returns the JSON, binary chunk, and base URL (empty for non-URL sources). */
async function fetchGltfAsset(source) {
	const isUrl = typeof source === "string";
	let baseUrl = "";
	if (isUrl) try {
		baseUrl = new URL(".", new URL(source, globalThis.location?.href)) + "";
	} catch {}
	const buffer = isUrl ? await (await fetch(source)).arrayBuffer() : source instanceof Blob ? await source.arrayBuffer() : source;
	if (buffer.byteLength >= 4 && new DV(buffer).getUint32(0, true) === 1179937895) return {
		...(await import("./gltf-glb-parser.js")).parseGlbContainer(buffer),
		baseUrl
	};
	return (await import("./gltf-json-asset.js")).parseGltfJsonAsset(buffer, baseUrl);
}
/** Cheap superset gate: returns true iff the asset can possibly trigger at least
*  one optional glTF feature. Every `_features` predicate in gltf-feature-registry
*  is implied by one of these buckets (all hasExt/hasMatExt features require a
*  non-empty `extensionsUsed`), so when this returns false the registry's
*  `loadGltfFeatures` would return `[]` anyway — letting the core loader skip the
*  registry import entirely and keep its ~24 feature import-thunks out of the
*  bundle for plain metallic-roughness assets. */
function assetUsesGltfFeatures(json) {
	return _rightHanded || json.extensionsUsed?.length || json.animations?.length || /extras|sparse/.test(JSON.stringify(json)) || json.skins?.length && anyPrimitive(json, (p) => p.attributes?.JOINTS_0 !== void 0) || anyPrimitive(json, (p) => !!p.targets?.length) || json.nodes?.some((n) => n.scale ? n.scale[0] * n.scale[1] * n.scale[2] < 0 : n.matrix ? mat4Determinant3(n.matrix) < 0 : false) || anyPrimitive(json, (p) => p.mode !== void 0 && p.mode !== 4) || needsOrmComposite(json);
}
/** Build a TransformNode tree mirroring the glTF node hierarchy.
*  Meshes are attached as children. Non-mesh nodes become
*  pure TransformNodes preserving TRS for cloning/repositioning.
*  Parent links are set by addToScene() when the tree is added to the scene.
*  Also returns a glTF-node-index → SceneNode map used by per-asset features
*  (KHR_node_visibility, KHR_animation_pointer) to address specific nodes. */
function buildNodeHierarchy(json, meshes, meshDatas) {
	const nodeToMeshes = [];
	for (let i = 0; i < meshDatas.length; i++) {
		const ni = meshDatas[i]._nodeIndex;
		(nodeToMeshes[ni] ??= []).push(meshes[i]);
	}
	const nodeMap = new Array(json.nodes?.length ?? 0);
	function buildNode(nodeIdx) {
		const node = json.nodes[nodeIdx];
		const name = node.name ?? `node_${nodeIdx}`;
		let tn;
		if (node.matrix) tn = createSceneNodeFromMatrix(name, node.matrix);
		else {
			const t = node.translation ?? [
				0,
				0,
				0
			];
			const r = node.rotation ?? [
				0,
				0,
				0,
				1
			];
			const s = node.scale ?? [
				1,
				1,
				1
			];
			tn = createTransformNode(name, t[0], t[1], t[2], r[0], r[1], r[2], r[3], s[0], s[1], s[2]);
		}
		nodeMap[nodeIdx] = tn;
		if (node.children) for (const childIdx of node.children) tn.children.push(buildNode(childIdx));
		const nodeMeshes = nodeToMeshes[nodeIdx] ?? [];
		tn.children.push(...nodeMeshes);
		return tn;
	}
	const rootChildren = (json.scenes?.[json.scene ?? 0]?.nodes ?? []).map((ni) => buildNode(ni));
	const root = createTransformNode("__root__", 0, 0, 0, 0, 0, 0, 1, _rightHanded ? 1 : -1, 1, 1);
	root.children.push(...rootChildren);
	return {
		root,
		nodeMap
	};
}
async function extractAllMeshes(json, binChunk, baseUrl, parentMap, worldMatrixCache, decodedPrimitives) {
	const imageCache = [];
	const matCache = [];
	const getMat = (matIdx) => {
		const key = (matIdx ?? -1) + 1;
		return matCache[key] ??= assembleMaterial(json, binChunk, key - 1, baseUrl, imageCache);
	};
	const partials = [];
	const matPromises = [];
	const _accs = json.accessors;
	const _bvs = json.bufferViews;
	const _strided = (p) => {
		for (const k in p.attributes) {
			const a = _accs[p.attributes[k]];
			const s = _bvs?.[a?.bufferView]?.byteStride;
			if (s !== void 0 && s !== (TYPE_SIZES[a.type] ?? 1) * (a.componentType === 5126 || a.componentType === 5125 ? 4 : a.componentType === 5123 || a.componentType === 5122 ? 2 : 1)) return true;
		}
		return false;
	};
	for (let nodeIdx = 0; nodeIdx < json.nodes.length; nodeIdx++) {
		const node = json.nodes[nodeIdx];
		if (node.mesh === void 0) continue;
		const meshIndex = node.mesh;
		const mesh = json.meshes[meshIndex];
		const worldMatrix = computeNodeWorldMatrix(json, nodeIdx, parentMap, worldMatrixCache);
		for (let primitiveIndex = 0; primitiveIndex < mesh.primitives.length; primitiveIndex++) {
			const primitive = mesh.primitives[primitiveIndex];
			const attrs = primitive.attributes;
			const decoded = decodedPrimitives.get(primitive);
			if (!decoded && _strided(primitive)) {
				const ip = await (await loadInterleave()).buildInterleavedPartial(json, binChunk, primitive, worldMatrix, nodeIdx);
				if (ip) {
					matPromises.push(getMat(primitive.material));
					partials.push(ip);
					continue;
				}
			}
			const resolveAttr = (name) => {
				if (decoded && decoded._attributes.has(name)) {
					const data = decoded._attributes.get(name);
					const componentCount = data.length / decoded._vertexCount;
					return {
						_data: data,
						_count: decoded._vertexCount,
						_componentCount: componentCount
					};
				}
				const idx = attrs[name];
				return idx !== void 0 ? resolveAccessor(json, binChunk, idx) : null;
			};
			const posData = resolveAttr("POSITION");
			const normData = resolveAttr("NORMAL");
			const uvData = resolveAttr("TEXCOORD_0");
			const uv2Data = resolveAttr("TEXCOORD_1");
			const tanData = resolveAttr("TANGENT");
			const colorData = resolveAttr("COLOR_0");
			const idxData = decoded ? decoded._indexCount > 0 ? {
				_data: decoded._indices,
				_count: decoded._indexCount,
				_componentCount: 1
			} : null : primitive.indices !== void 0 ? resolveAccessor(json, binChunk, primitive.indices) : null;
			const normalsHelper = !idxData || !normData ? await import("./gltf-normals.js") : null;
			const colors = colorData ? (await importColorNormalize()).normalizeColorToVec4(colorData._data, colorData._count, colorData._componentCount) : null;
			const uvs = uvData ? uvData._data instanceof F32 ? uvData._data : (await importColorNormalize()).normalizeUvToVec2(uvData._data, uvData._count) : new F32(posData._count * 2);
			const uv2s = uv2Data ? uv2Data._data instanceof F32 ? uv2Data._data : (await importColorNormalize()).normalizeUvToVec2(uv2Data._data, uv2Data._count) : null;
			const indices = idxData ? idxData._data instanceof U32 ? new U32(idxData._data) : idxData._data instanceof U8 ? Uint16Array.from(idxData._data) : new U16(idxData._data.buffer, idxData._data.byteOffset, idxData._count) : normalsHelper.createSequentialIndices(posData._count);
			matPromises.push(getMat(primitive.material));
			const normals = normData ? normData._data : normalsHelper.computeSmoothNormals(posData._data, indices, posData._count);
			partials.push({
				_positions: posData._data,
				_normals: normals,
				_tangents: tanData ? tanData._data : null,
				_uvs: uvs,
				_uv2s: uv2s,
				_colors: colors,
				_flatNormal: !normData,
				_indices: indices,
				_vertexCount: posData._count,
				_indexCount: indices.length,
				_worldMatrix: worldMatrix,
				_nodeIndex: nodeIdx,
				_primitive: primitive,
				_decoded: decoded
			});
		}
	}
	const materials = await Promise.all(matPromises);
	return partials.map((p, i) => ({
		...p,
		_material: materials[i]
	}));
}
var _generateMipmaps = null;
async function ensureMipmapModule() {
	if (!_generateMipmaps) _generateMipmaps = (await import("../texture/generate-mipmaps.js")).generateMipmaps;
}
async function uploadMeshes(meshDatas, features, ctx) {
	const { _engine: engine, _json: json, _binChunk: binChunk, _baseUrl: baseUrl, _matExts: matExts, _wrapTex: wrapTex } = ctx;
	const sampler = getOrCreateSampler(engine, {
		magFilter: "linear",
		minFilter: "linear",
		mipmapFilter: "linear",
		addressModeU: "repeat",
		addressModeV: "repeat",
		maxAnisotropy: 4
	});
	let samplerFor;
	let buildSampledPbrTextures;
	if (json.samplers?.some((s) => s.wrapS > 10497 || s.wrapT > 10497 || s.magFilter === 9728 || s.minFilter != null && s.minFilter !== 9729 && s.minFilter !== 9987)) {
		const mod = await import("./gltf-sampler-desc.js");
		samplerFor = mod.makeSamplerFor(engine, json, sampler);
		buildSampledPbrTextures = mod.buildSampledPbrTextures;
	}
	await ensureMipmapModule();
	const meshFeatures = features.filter((f) => f.applyMesh);
	const texCache = /* @__PURE__ */ new Map();
	const getCachedTexture = (bitmap, srgb) => {
		let textures = texCache.get(bitmap);
		if (!textures) texCache.set(bitmap, textures = []);
		const key = +srgb;
		let tex = textures[key];
		if (!tex) {
			tex = uploadTex(engine, bitmap, srgb, sampler, _generateMipmaps);
			textures[key] = tex;
		}
		return tex;
	};
	const extImageCache = matExts.length ? [] : null;
	const extFetchImg = extImageCache ? makeImageFetcher(json, binChunk, baseUrl, extImageCache) : null;
	const extCtx = {
		_engine: engine,
		async _texture(texInfo, sRGB) {
			if (!texInfo || !extFetchImg) return;
			const img = await extFetchImg(texInfo);
			return img ? wrapTex(getCachedTexture(img, sRGB), texInfo) : void 0;
		},
		_uploadImage(bitmap, sRGB) {
			return uploadTex(engine, bitmap, sRGB, sampler, _generateMipmaps);
		}
	};
	let _needsPbrExt = wrapTex !== identityTexWrap;
	if (!_needsPbrExt) {
		const mats = json.materials;
		if (mats && JSON.stringify(mats).includes("\"texCoord\":1")) _needsPbrExt = true;
	}
	let _pbrExtPromise = null;
	const _ensurePbrExt = () => _pbrExtPromise ??= import("./gltf-pbr-builder-ext.js");
	/** Default ORM upload: single MR-or-occlusion image, or 1×1 fallback baked from
	*  metallicFactor/roughnessFactor. The composite case (MR+occlusion separate) is
	*  handled by the gltf-ext-orm extension which overrides this via `extLayers`. */
	const builtMaterialCache = /* @__PURE__ */ new Map();
	const buildPbrFromGltfMat = (mat) => {
		let cached = builtMaterialCache.get(mat);
		if (!cached) {
			cached = (async () => {
				const extLayers = matExts.length ? await ctx._runMatExts(mat, matExts, extCtx) : void 0;
				let props;
				if (_needsPbrExt) {
					const extMod = await _ensurePbrExt();
					const tex = extMod.buildDefaultPbrTexturesExt(engine, mat, sampler, _generateMipmaps, getCachedTexture, wrapTex, extLayers, samplerFor);
					props = extMod.assemblePbrPropsExt(mat, tex, extLayers);
					await extMod.applyGltfUvTransform(props, tex);
				} else {
					const tex = buildSampledPbrTextures ? buildSampledPbrTextures(engine, mat, sampler, _generateMipmaps, samplerFor, getCachedTexture, extLayers) : buildDefaultPbrTextures(engine, mat, sampler, _generateMipmaps, getCachedTexture, extLayers);
					props = assemblePbrProps(mat, tex.baseColorTexture, tex.ormTexture, tex.normalTexture, tex.emissiveTexture, extLayers);
				}
				await applyGltfOptInPbrFeatures(props, mat);
				return props;
			})();
			builtMaterialCache.set(mat, cached);
		}
		return cached;
	};
	if (new Set(meshDatas.map((m) => m._primitive)).size < meshDatas.length) return import("./gltf-share.js").then((module) => module.share(meshDatas, buildPbrFromGltfMat, buildTightGltfMesh, meshFeatures, ctx));
	return Promise.all(meshDatas.map(async (m, i) => {
		const material = await buildPbrFromGltfMat(m._material);
		const meshName = json.meshes[json.nodes[m._nodeIndex].mesh].name || `gltf_mesh_${i}`;
		const mesh = m._vb ? (await loadInterleave()).buildInterleavedMesh(engine, m, i, material, meshName) : buildTightGltfMesh(engine, m, material, meshName);
		mesh._authoredSign = -1;
		await Promise.all(meshFeatures.map((f) => f.applyMesh(m, mesh, ctx)));
		return mesh;
	}));
}
export { loadGltf };

//# sourceMappingURL=load-gltf.js.map