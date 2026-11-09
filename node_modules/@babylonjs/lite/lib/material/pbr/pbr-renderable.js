import { F32 } from "../../engine/typed-arrays.js";
import { acquireTexture } from "../../resource/texture-acquire.js";
import { releaseTexture } from "../../resource/texture-release.js";
import { createUniformBuffer } from "../../resource/uniform-buffer.js";
import { _computeMeshFeatures, _meshTangentFeature } from "../mesh-features.js";
import "./pbr-flag-bits.js";
import { _getPbrExts, _getPbrSceneHooks, _registerPbrExt } from "./pbr-flags.js";
import { writeMeshLightSelection } from "../../render/mesh-light-selection.js";
import { packMat4IntoF32 } from "../../math/pack-mat4-into-f32.js";
import { collectPbrBoundTextures } from "./collect-pbr-bound-textures.js";
import { _computePbrMaterialFeatures } from "./pbr-material-features.js";
import { _pbrBindingIdentity, clearPbrPipelineCache, createPbrMeshBindGroup, getOrCreatePbrBindings, getOrCreatePbrPipeline } from "./pbr-pipeline.js";
import { pbrBindingDecorator } from "./pbr-binding-decorator.js";
import { _pbrLazyWgslNeeds, createPbrComposer } from "./pbr-compose.js";
import { StandardToneMapping } from "./tone-mapping.js";
// src/material/pbr/pbr-renderable.ts
/** PBR mesh renderable — builds Renderables from glTF PBR meshes + environment.
*
*  `buildPbrRenderables` does shared per-scene setup (extension/fragment imports,
*  shader composer, scene bind group, multi-light UBO), then delegates per-mesh
*  work to `buildSinglePbrRenderable`. Both initial build and material-swap
*  rebuilds go through the same single-mesh function. */
var LAZY_CAP_GAMMA = 1;
var ALL_LAZY_CAPS = LAZY_CAP_GAMMA | 14;
/** @internal Lazy caps a mesh's current material needs (exported for the composition-parity test). */
function _lazyPbrCaps(mesh) {
	const mat = mesh.material;
	if (!mat) return 0;
	const features = (mat._renderFeatures ?? _computePbrMaterialFeatures(mat)).features;
	return (mat._gammaAlbedo ? LAZY_CAP_GAMMA : 0) | _pbrLazyWgslNeeds(features, _meshTangentFeature(mesh));
}
function _neededLightPath(scene, mesh, hasShadows) {
	const mat = mesh.material;
	if (!mat) return null;
	const features2 = (mat._renderFeatures ?? _computePbrMaterialFeatures(mat)).features2 ?? 0;
	const lr = writeMeshLightSelection(mesh, scene.lights);
	const lightCount = lr > 0 ? 1 : -lr;
	if (!lightCount) return null;
	const receiveShadows = !((features2 & 98304) !== 0) && mesh.receiveShadows && hasShadows;
	return lightCount === 1 && !receiveShadows ? getPackedSingleLightType(scene.lights, lr - 1) : true;
}
/** Widening predicate for a closure built with `caps` and `paths` loaded (null when nothing can be missing). */
function lazyCapsWidening(scene, caps, paths, hasShadows) {
	const missesLightPath = (mesh) => {
		const needed = _neededLightPath(scene, mesh, hasShadows);
		return needed === null ? false : needed === true ? !paths._m : !paths._s.includes(needed);
	};
	return Object.assign((mesh) => (caps === ALL_LAZY_CAPS ? 0 : _lazyPbrCaps(mesh) & ~caps) || missesLightPath(mesh), {
		_c: caps,
		_p: paths
	});
}
/** Build PBR Renderable(s) + a SceneUniformUpdater from PBR meshes. */
async function buildPbrRenderables(scene, meshes, envTextures) {
	const engine = scene.surface.engine;
	const device = engine._device;
	const materialScratch = /* @__PURE__ */ new Map();
	const hasEnv = !!envTextures;
	const shadowLights = [];
	for (let i = 0; i < scene.lights.length; i++) {
		const sg = scene.lights[i].shadowGenerator;
		if (sg) shadowLights.push({
			lightIndex: i,
			shadowType: sg._shadowType,
			gen: sg
		});
	}
	const hasSomeShadows = shadowLights.length > 0;
	let hasAnyAffectedLight = false;
	let needsSingleLightPath = false;
	let needsMultiLightPath = false;
	const singleLightTypes = [];
	const scanLightPaths = () => {
		for (const mesh of meshes) {
			const lr = writeMeshLightSelection(mesh, scene.lights);
			const affectedCount = lr > 0 ? 1 : -lr;
			hasAnyAffectedLight ||= affectedCount > 0;
			if (affectedCount === 1) {
				needsSingleLightPath = true;
				const type = getPackedSingleLightType(scene.lights, lr - 1);
				if (!singleLightTypes.includes(type)) singleLightTypes.push(type);
				needsMultiLightPath ||= mesh.receiveShadows && hasSomeShadows;
			} else if (affectedCount > 0) needsMultiLightPath = true;
		}
	};
	scanLightPaths();
	let hasSomeSkeletons = false;
	let hasSomeMorphs = false;
	let hasSomeThinInstances = false;
	let hasCullingTI = false;
	let hasAnyUvTransform = false;
	let hasAnyUv2 = false;
	let hasAnyVertexColor = false;
	let hasAnyFlatNormal = false;
	let lazyCaps = 0;
	for (let i = 0; i < meshes.length; i++) {
		const m = meshes[i];
		const mat = m.material;
		hasSomeSkeletons ||= !!m.skeleton;
		hasSomeMorphs ||= !!m.morphTargets;
		hasSomeThinInstances ||= !!m.thinInstances;
		hasCullingTI ||= !!m.thinInstances?._gpuCullingEnabled;
		hasAnyUvTransform ||= !!mat._hasUvTx;
		hasAnyUv2 ||= !!m._gpu.uv2Buffer && !!mat._uv2Mask;
		hasAnyVertexColor ||= !!m._gpu.colorBuffer;
		hasAnyFlatNormal ||= !!m._flatNormal;
		lazyCaps |= _lazyPbrCaps(m);
	}
	const group = scene._groups.get(meshes[0].material._buildGroup);
	const livePredicate = group.r ? group._w : void 0;
	group._w = lazyCapsWidening(scene, lazyCaps & (group.r ? livePredicate?._c ?? ALL_LAZY_CAPS : ALL_LAZY_CAPS), livePredicate?._p ?? {
		_s: singleLightTypes,
		_m: needsMultiLightPath
	}, hasSomeShadows);
	if (hasEnv) {
		const mod = await import("./fragments/ibl-fragment.js");
		_registerPbrExt(mod.pbrExt);
	}
	let _flatNormalWgsl = "";
	if (hasAnyFlatNormal) _flatNormalWgsl = (await import("./fragments/flat-normal-wgsl.js")).FLAT_NORMAL_WGSL;
	let _createPbrShadowFragment = null;
	let shadowBindings;
	let _singleLightWGSL = "";
	let _getSingleLightBlock = null;
	const singleLightBlocks = {};
	let _multiLightWGSL = "";
	let _multiLightLoop = "";
	let multiLightLoaded = false;
	const loadLightPaths = async () => {
		if (needsSingleLightPath) {
			for (const type of singleLightTypes) {
				if (singleLightBlocks[type]) continue;
				const single = scene._lighting?._single?.(type) ?? await importSingleLightWgsl(type);
				_singleLightWGSL = single.SINGLE_LIGHT_STRUCTS;
				singleLightBlocks[type] = single.getSingleLightBlock;
			}
			_getSingleLightBlock = (type) => singleLightBlocks[type]?.() ?? "";
		}
		if (needsMultiLightPath && !multiLightLoaded) {
			multiLightLoaded = true;
			const contribution = scene._lighting?._multi?.();
			if (contribution) {
				_multiLightWGSL = contribution._helpers;
				_multiLightLoop = contribution._loop;
			} else {
				const wgslMod = await import("./fragments/multilight-wgsl.js");
				_multiLightWGSL = wgslMod.MULTI_LIGHT_STRUCTS() + wgslMod.COMPUTE_PBR_LIGHT;
				_multiLightLoop = wgslMod.getMultiLightLoop();
			}
		}
		if (hasAnyAffectedLight && hasSomeShadows && !_createPbrShadowFragment) {
			const shadowMod = await import("./fragments/pbr-shadow-fragment.js");
			_createPbrShadowFragment = await shadowMod.preparePbrShadowFragment(shadowLights);
			shadowBindings = shadowMod.createMaterialShadowBindings(engine, shadowLights);
		}
	};
	/** Whether a light path the current selection needs has not been loaded yet. */
	const lightPathsMissing = () => needsSingleLightPath && singleLightTypes.some((type) => !singleLightBlocks[type]) || needsMultiLightPath && !multiLightLoaded || hasAnyAffectedLight && hasSomeShadows && !_createPbrShadowFragment;
	await loadLightPaths();
	const _drainPbrExts = async (loaders) => {
		for (const [flag, load] of loaders) if (flag) _registerPbrExt((await load()).pbrExt);
	};
	for (const hook of _getPbrSceneHooks()) await hook(scene, engine, meshes);
	await _drainPbrExts([[hasSomeSkeletons, () => import("./fragments/skeleton-fragment.js")], [hasSomeMorphs, () => import("./fragments/morph-fragment.js")]]);
	let _createPbrTemplateExt = null;
	if (hasAnyUvTransform || hasAnyVertexColor || hasAnyUv2) _createPbrTemplateExt = (await import("./pbr-template-ext.js")).createPbrTemplateExt;
	let _createThinInstanceFragment = null;
	let _syncThinInstanceBuffers = null;
	let _cull;
	let _syncThinInstanceForDraw = null;
	if (hasSomeThinInstances) {
		_createThinInstanceFragment = (await import("../../shader/fragments/thin-instance-fragment.js")).createThinInstanceFragment;
		const gpuMod = await import("../../mesh/thin-instance-gpu.js");
		_syncThinInstanceBuffers = gpuMod.syncThinInstanceBuffers;
		if (hasCullingTI) _cull = await import("../../mesh/thin-instance-cull-binding.js");
		_syncThinInstanceForDraw = gpuMod.syncThinInstanceForDraw;
	}
	const toneMapping = scene.imageProcessing.toneMappingEnabled ? scene.imageProcessing.toneMapping ?? StandardToneMapping : void 0;
	let _fogHelper = "";
	let _fogBlock = "";
	if (scene.fog) {
		const fogMod = await import("./pbr-fog-wgsl.js");
		_fogHelper = fogMod.PBR_FOG_HELPER;
		_fogBlock = fogMod.PBR_FOG_BLOCK;
	}
	let loadCaps = 0;
	for (const m of meshes) loadCaps |= _lazyPbrCaps(m);
	const _tangentNormal = loadCaps & 2 ? await import("./fragments/pbr-normal-tangent-wgsl.js") : void 0;
	const _cotangentNormal = loadCaps & 4 ? await import("./fragments/pbr-normal-cotangent-wgsl.js") : void 0;
	const _specGloss = loadCaps & 8 ? await import("./fragments/pbr-spec-gloss-wgsl.js") : void 0;
	scanLightPaths();
	while (lightPathsMissing()) {
		await loadLightPaths();
		scanLightPaths();
	}
	const composePbr = createPbrComposer({
		_singleLightWGSL,
		_getSingleLightBlock,
		_multiLightWGSL,
		_multiLightLoop,
		_tm: toneMapping,
		_fogHelper,
		_fogBlock,
		_createPbrTemplateExt,
		_flatNormalWgsl,
		_tangentNormal,
		_cotangentNormal,
		_specGloss,
		_createPbrShadowFragment,
		_shadowLights: shadowLights,
		_createThinInstanceFragment
	});
	const sceneFeatures = (hasEnv ? 4 : 0) | (toneMapping ? 16 : 0) | (scene.fog ? 32 : 0);
	const syncThinInstanceBuffers = _syncThinInstanceBuffers;
	const syncThinInstanceForDraw = _syncThinInstanceForDraw;
	const geometryContext = {
		_composePbr: composePbr,
		_sceneFeatures: sceneFeatures,
		_envTextures: envTextures ?? null,
		_shadowLights: shadowLights,
		_syncThinInstanceBuffers,
		_syncThinInstanceForDraw
	};
	const rebuildSingle = (s, mesh, materialOverride, resources) => {
		const mat = materialOverride ?? mesh.material;
		const renderFeatures = mat._renderFeatures ??= _computePbrMaterialFeatures(mat);
		const isOverride = materialOverride != null;
		const lr = writeMeshLightSelection(mesh, s.lights);
		const sceneFeatures = geometryContext._sceneFeatures | (s._lighting?._pbrFeatures?.(mesh) ?? 0);
		const lightCount = lr > 0 ? 1 : -lr;
		const features2 = renderFeatures.features2 ?? 0;
		const receiveShadows = !((features2 & 98304) !== 0) && mesh.receiveShadows && hasSomeShadows;
		const meshFeatures = _computeMeshFeatures(mesh, receiveShadows) | (mesh._primitiveFeatures ?? 0);
		const features = renderFeatures.features | (!(features2 & 98304) ? meshFeatures >>> 16 & 64 : 0);
		const lightMode = lightCount === 0 ? 0 : lightCount === 1 && !receiveShadows ? 1 : 2;
		const singleLightType = lightMode === 1 ? getPackedSingleLightType(s.lights, lr - 1) : "";
		const esmShadowDepthCode = (features2 & 65536) !== 0 ? mat._esmShadowDepthCode : "";
		const vbLayout = mesh._gpu._vbLayout;
		const vbKey = mesh._gpu._vbKey ?? "";
		const uv2Mask = mat._uv2Mask ?? 0;
		const pluginIndex = mat._pi ?? 0;
		const composed = composePbr(features, features2, meshFeatures, sceneFeatures, lightMode, singleLightType, esmShadowDepthCode, vbLayout, vbKey, uv2Mask, pluginIndex);
		composed._prim = mesh._primitive;
		const bindings = getOrCreatePbrBindings(engine, features, features2, meshFeatures, sceneFeatures, composed, `${lightMode}:${singleLightType}${vbKey}:${uv2Mask}:${toneMapping?.id ?? 0}:${pluginIndex}`, mat.stencil ?? null);
		const meshUboData = new F32(composed._meshUboSpec._totalBytes / 4);
		const _packMeshWorld = engine._makePackMeshWorld?.(s) ?? packMat4IntoF32;
		_packMeshWorld(meshUboData, mesh.worldMatrix, 0, 0);
		writeMeshLightSelection(mesh, s.lights, meshUboData);
		const disposers = resources?._lifetimeDisposers ?? [];
		if (!resources) s._meshDisposables.set(mesh, disposers);
		const meshUBO = createUniformBuffer(engine, meshUboData);
		disposers.push(() => meshUBO.destroy());
		const materialSpec = composed._materialUboSpec;
		const matInitData = new F32(materialSpec._totalBytes / 4);
		_writeMaterialData(matInitData, mat, materialSpec);
		const materialUBO = createUniformBuffer(engine, matInitData);
		disposers.push(() => materialUBO.destroy());
		const needsTaskRefraction = !!mat._transmissive && (features2 & 16) !== 0;
		if (pbrBindingDecorator) pbrBindingDecorator._prepare(mat._preparedPlugins, s);
		const materialBindGroupStatic = needsTaskRefraction ? null : createPbrMeshBindGroup(engine, bindings, composed, meshUBO, materialUBO, mat, envTextures ?? null, mesh, void 0, _pbrBindingIdentity?.(s._lighting?._bindingId), disposers);
		const shadowBindGroup = receiveShadows && bindings._shadowBGL ? shadowBindings(bindings._shadowBGL) : null;
		const boundTextures = collectPbrBoundTextures(mat);
		for (const t of boundTextures) acquireTexture(t);
		disposers.push(() => {
			for (const t of boundTextures) releaseTexture(t);
		});
		const isTransparent = (features2 & 98304) === 0 && (features & 64) !== 0;
		const order = mesh.renderOrder ?? (isTransparent || needsTaskRefraction ? 150 : 100);
		const hasNormalMap = (features & 1) !== 0;
		const hasUV2 = (features2 & 2048) !== 0 && (meshFeatures & 128) !== 0;
		const hasVertexColor = (meshFeatures & 64) !== 0;
		const hasTI = (meshFeatures & 16) !== 0;
		const hasTIColor = (meshFeatures & 32) !== 0;
		let _lastWorldVersion = mesh.worldMatrixVersion;
		let _lastLightsCount = s.lights.length;
		let thinDrawArgs = null;
		const sortCenter = isTransparent || needsTaskRefraction ? [
			mesh.worldMatrix[12],
			mesh.worldMatrix[13],
			mesh.worldMatrix[14]
		] : null;
		const _baseUpdate = () => {
			const worldVersion = mesh.worldMatrixVersion;
			if (worldVersion !== _lastWorldVersion || s.lights.length !== _lastLightsCount) {
				if (sortCenter) {
					sortCenter[0] = mesh.worldMatrix[12];
					sortCenter[1] = mesh.worldMatrix[13];
					sortCenter[2] = mesh.worldMatrix[14];
				}
				_packMeshWorld(meshUboData, mesh.worldMatrix, 0, 0);
				writeMeshLightSelection(mesh, s.lights, meshUboData);
				device.queue.writeBuffer(meshUBO, 0, meshUboData);
				_lastWorldVersion = worldVersion;
				_lastLightsCount = s.lights.length;
			}
			const uboVersion = mat._uboVersion;
			if (uboVersion !== _lastUboVersion) {
				_lastUboVersion = uboVersion;
				let data = materialScratch.get(materialSpec._totalBytes);
				if (!data) {
					data = new F32(materialSpec._totalBytes / 4);
					materialScratch.set(materialSpec._totalBytes, data);
				} else data.fill(0);
				_writeMaterialData(data, mat, materialSpec);
				device.queue.writeBuffer(materialUBO, 0, data.buffer, 0, data.byteLength);
			}
			if (hasTI) thinDrawArgs = syncThinInstanceForDraw(engine, mesh.thinInstances, hasTIColor, mesh._gpu);
		};
		const _invalidate = () => {
			_lastWorldVersion = -1;
		};
		const update = engine._wrapRenderableForFO?.(_baseUpdate, s, _invalidate) ?? _baseUpdate;
		const drawWith = (pass, materialBindGroup, cullBinding) => {
			if (!isOverride && mesh.material !== mat) return 0;
			const gpu = mesh._gpu;
			pass.setBindGroup(1, materialBindGroup);
			if (shadowBindGroup) pass.setBindGroup(2, shadowBindGroup);
			let slot = 0;
			pass.setVertexBuffer(slot++, gpu.positionBuffer);
			pass.setVertexBuffer(slot++, gpu.normalBuffer);
			if (hasNormalMap && gpu.tangentBuffer) pass.setVertexBuffer(slot++, gpu.tangentBuffer);
			pass.setVertexBuffer(slot++, gpu.uvBuffer);
			if (hasUV2 && gpu.uv2Buffer) pass.setVertexBuffer(slot++, gpu.uv2Buffer);
			if (hasVertexColor && gpu.colorBuffer) pass.setVertexBuffer(slot++, gpu.colorBuffer);
			const skin = mesh.skeleton ?? mesh.vat;
			if (skin) {
				pass.setVertexBuffer(slot++, skin.jointsBuffer);
				pass.setVertexBuffer(slot++, skin.weightsBuffer);
				if (skin.joints1Buffer && skin.weights1Buffer) {
					pass.setVertexBuffer(slot++, skin.joints1Buffer);
					pass.setVertexBuffer(slot++, skin.weights1Buffer);
				}
			}
			const ti = hasTI ? mesh.thinInstances : null;
			if (ti && syncThinInstanceBuffers) slot = syncThinInstanceBuffers(engine, ti, pass, slot, hasTIColor, cullBinding?.cullDrawBufs);
			pass.setIndexBuffer(gpu.indexBuffer, gpu.indexFormat);
			if (cullBinding) cullBinding.draw(pass, gpu, ti.count);
			else if (thinDrawArgs) pass.drawIndexedIndirect(thinDrawArgs, 0);
			else pass.drawIndexed(gpu.indexCount, ti?.count ?? 1, gpu._firstIndex ?? 0, gpu._baseVertex);
			return 1;
		};
		const r = {
			order,
			isTransparent,
			_transmissive: needsTaskRefraction,
			mesh,
			_gen: [
				geometryContext,
				meshFeatures,
				lightMode,
				singleLightType,
				renderFeatures
			],
			bind(eng, sig) {
				if (pbrBindingDecorator) pbrBindingDecorator._prepare(mat._preparedPlugins, s);
				const pipeline = getOrCreatePbrPipeline(eng, sig, bindings, mat);
				const materialBindGroup = needsTaskRefraction ? createPbrMeshBindGroup(engine, bindings, composed, meshUBO, materialUBO, mat, envTextures ?? null, mesh, sig._transmissionTexture, _pbrBindingIdentity?.(s._lighting?._bindingId), disposers) : materialBindGroupStatic;
				const cb = _cull?.tryBind(r, s, mesh, engine, hasTIColor, isTransparent || needsTaskRefraction, update, sig);
				const binding = {
					renderable: r,
					pipeline,
					...cb ? { _updateBatches: [cb._updateBatch] } : {},
					update: cb ? cb.update : update,
					draw: (pass) => drawWith(pass, materialBindGroup, cb)
				};
				if (!pbrBindingDecorator) return binding;
				return pbrBindingDecorator(binding, engine, mat._preparedPlugins, composed._fragmentKey, features, features2, () => createPbrMeshBindGroup(engine, bindings, composed, meshUBO, materialUBO, mat, envTextures ?? null, mesh, sig._transmissionTexture, _pbrBindingIdentity?.(s._lighting?._bindingId), disposers), (pass, group) => drawWith(pass, group, cb), disposers, s);
			}
		};
		if (sortCenter) r._worldCenter = sortCenter;
		let _lastUboVersion = mat._uboVersion;
		return r;
	};
	const renderables = meshes.map((m) => rebuildSingle(scene, m));
	geometryContext._b = new Set(composePbr._c.keys());
	scene._pbrGeomContext = geometryContext;
	scene._disposables.push(clearPbrPipelineCache);
	return {
		renderables,
		rebuildSingle,
		_w: lazyCapsWidening(scene, loadCaps, {
			_s: singleLightTypes.slice(),
			_m: needsMultiLightPath
		}, hasSomeShadows)
	};
}
function getPackedSingleLightType(lights, packedIndex) {
	let packed = 0;
	for (const light of lights) {
		if (!light._writeLightUbo) continue;
		if (packed === packedIndex) return light.lightType;
		packed++;
	}
	return "point";
}
async function importSingleLightWgsl(type) {
	if (type === "hemispheric") return import("./fragments/singlelight-hemispheric-wgsl.js");
	if (type === "directional") return import("./fragments/singlelight-directional-wgsl.js");
	if (type === "spot") return import("./fragments/singlelight-spot-wgsl.js");
	return import("./fragments/singlelight-point-wgsl.js");
}
/** @internal Write material properties into a pre-allocated Float32Array.
*  Core fields only; per-extension slices are contributed by registered
*  writers. Exported for the PBR geometry-renderer path. */
function _writeMaterialData(data, material, spec) {
	data[0] = material.environmentIntensity ?? 1;
	data[1] = material.directIntensity ?? 1;
	data[2] = material.reflectance ?? .04;
	data[3] = material.alpha ?? 1;
	const baseColorFactorOffset = spec._offsets.get("baseColorFactor");
	if (baseColorFactorOffset !== void 0) {
		const off = baseColorFactorOffset / 4;
		const factor = material.baseColorFactor;
		data[off] = factor ? factor[0] : 1;
		data[off + 1] = factor ? factor[1] : 1;
		data[off + 2] = factor ? factor[2] : 1;
		data[off + 3] = factor ? factor[3] : 1;
	}
	if (spec._offsets.has("metallicFactor")) {
		const off = spec._offsets.get("metallicFactor") / 4;
		data[off] = material.metallicFactor ?? 1;
		data[off + 1] = material.roughnessFactor ?? 1;
		data[off + 2] = material.normalTextureScale ?? 1;
		data[off + 3] = material.usePhysicalLightFalloff === false ? 0 : 1;
	}
	for (const ext of _getPbrExts().values()) if (ext.writeUbo) ext.writeUbo(data, material, spec._offsets);
}
export { _lazyPbrCaps, _writeMaterialData, buildPbrRenderables };

//# sourceMappingURL=pbr-renderable.js.map