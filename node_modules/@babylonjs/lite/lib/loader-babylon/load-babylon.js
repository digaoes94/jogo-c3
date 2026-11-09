import { F32, U32 } from "../engine/typed-arrays.js";
import { loadTexture2D } from "../texture/texture-2d.js";
import { initMeshTransform, uploadMeshToGPU } from "../mesh/mesh.js";
import { createStandardMaterial } from "../material/standard/create-standard-material.js";
import { createTransformNode } from "../scene/transform-node.js";
// src/loader-babylon/load-babylon.ts
/**
* .babylon format loader — parses Babylon.js .babylon scene files.
*
* Supports:
* - Standard materials with diffuse, bump, specular, ambient, lightmap, opacity textures
* - Inline vertex data (positions, normals, UVs, indices)
* - Point lights
* - Scene clear color
* - SubMesh → multi-material handling
* - Parent-child hierarchy via parentId
*/
var TEX_SLOTS = [
	{
		src: "diffuseTexture",
		set: (m, tex) => {
			m.diffuseTexture = tex;
		},
		coordIndex: {
			dst: "diffuseCoordIndex",
			only1: true
		},
		extra: (t, m) => {
			m.uvScale = [t.uScale ?? 1, t.vScale ?? 1];
			if (t.hasAlpha) m.alphaCutOff = .4;
		}
	},
	{
		src: "bumpTexture",
		set: (m, tex) => import("../material/standard/set-std-bump.js").then(({ setStandardBumpTexture }) => setStandardBumpTexture(m, tex)),
		level: "bumpLevel"
	},
	{
		src: "specularTexture",
		set: (m, tex) => import("../material/standard/set-std-specular.js").then(({ setStandardSpecularTexture }) => setStandardSpecularTexture(m, tex)),
		coordIndex: {
			dst: "specularCoordIndex",
			only1: true
		}
	},
	{
		src: "ambientTexture",
		set: (m, tex) => import("../material/standard/set-std-ambient.js").then(({ setStandardAmbientTexture }) => setStandardAmbientTexture(m, tex)),
		level: "ambientTexLevel",
		coordIndex: {
			dst: "ambientCoordIndex",
			only1: true
		}
	},
	{
		src: "lightmapTexture",
		set: (m, tex) => import("../material/standard/set-std-lightmap.js").then(({ setStandardLightmapTexture }) => setStandardLightmapTexture(m, tex)),
		level: "lightmapLevel",
		coordIndex: { dst: "lightmapCoordIndex" }
	},
	{
		src: "opacityTexture",
		set: (m, tex) => import("../material/standard/set-std-opacity.js").then(({ setStandardOpacityTexture }) => setStandardOpacityTexture(m, tex)),
		level: "opacityLevel",
		extra: (t, m) => {
			if (t.getAlphaFromRGB) m.opacityFromRGB = true;
		}
	},
	{
		src: "reflectionTexture",
		set: (m, tex) => import("../material/standard/set-std-reflection.js").then(({ setStandardReflectionTexture }) => setStandardReflectionTexture(m, tex)),
		level: "reflectionLevel",
		skipIf: (t) => t.isCube === true,
		extra: (t, m) => {
			if (t.coordinatesMode === 2) m.reflectionCoordMode = 2;
		}
	}
];
/**
* Load a .babylon scene file and return a AssetContainer.
* Pass the result to addToScene() to populate the scene.
*
* @param engine - The engine (provides GPU device)
* @param url - URL to the .babylon file
* @param opts - Optional loader configuration
*/
async function loadBabylon(engine, url, opts = {}) {
	const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
	const data = await (await fetch(url)).json();
	let clearColor;
	if (data.clearColor) clearColor = {
		r: data.clearColor[0],
		g: data.clearColor[1],
		b: data.clearColor[2],
		a: 1
	};
	const sceneAmbient = data.ambientColor ? [
		data.ambientColor[0],
		data.ambientColor[1],
		data.ambientColor[2]
	] : [
		0,
		0,
		0
	];
	const materialMap = /* @__PURE__ */ new Map();
	const texturePromises = [];
	if (data.materials) for (const md of data.materials) {
		const mat = createStandardMaterial();
		if (md.diffuse) mat.diffuseColor = [
			md.diffuse[0],
			md.diffuse[1],
			md.diffuse[2]
		];
		if (md.specular) mat.specularColor = [
			md.specular[0],
			md.specular[1],
			md.specular[2]
		];
		if (md.specularPower != null) mat.specularPower = md.specularPower;
		if (md.emissive) mat.emissiveColor = [
			md.emissive[0],
			md.emissive[1],
			md.emissive[2]
		];
		if (md.ambient) mat.ambientColor = [
			md.ambient[0] * sceneAmbient[0],
			md.ambient[1] * sceneAmbient[1],
			md.ambient[2] * sceneAmbient[2]
		];
		if (md.alpha != null) mat.alpha = md.alpha;
		if (md.alphaCutOff != null) mat.alphaCutOff = md.alphaCutOff;
		if (md.backFaceCulling === false) mat.backFaceCulling = false;
		if (opts.loadTextures !== false) for (const slot of TEX_SLOTS) {
			const t = md[slot.src];
			if (!t) continue;
			if (slot.skipIf?.(t)) continue;
			if (slot.level && t.level != null) mat[slot.level] = t.level;
			if (slot.coordIndex) {
				if (slot.coordIndex.only1) {
					if (t.coordinatesIndex === 1) mat[slot.coordIndex.dst] = 1;
				} else if (t.coordinatesIndex != null) mat[slot.coordIndex.dst] = t.coordinatesIndex === 1 ? 1 : 0;
			}
			slot.extra?.(t, mat);
			const texUrl = baseUrl + t.name;
			texturePromises.push(loadTexture2D(engine, texUrl).then((tex) => slot.set(mat, tex)));
		}
		if (md.reflectionTexture && opts.loadTextures !== false && md.reflectionTexture.isCube) {
			if (md.reflectionTexture.level != null) mat.reflectionLevel = md.reflectionTexture.level;
			const cubeName = md.reflectionTexture.name;
			texturePromises.push(import("../texture/cube-texture.js").then(({ loadCubeTexture }) => loadCubeTexture(engine, baseUrl + cubeName).then(async (cube) => {
				const { setStandardReflectionCubeTexture } = await import("../material/standard/set-std-cube-reflection.js");
				setStandardReflectionCubeTexture(mat, cube);
			})));
		}
		materialMap.set(md.id, mat);
	}
	await Promise.all(texturePromises);
	const multiMatMap = /* @__PURE__ */ new Map();
	if (data.multiMaterials) for (const mm of data.multiMaterials) multiMatMap.set(mm.id, mm.materials);
	const lights = [];
	if (data.lights?.length) {
		const { createPointLight } = await import("../light/point-light.js");
		for (const ld of data.lights) if (ld.type === 0 && ld.position) {
			const pl = createPointLight([
				ld.position[0],
				ld.position[1],
				ld.position[2]
			], ld.intensity ?? 1);
			if (ld.diffuse) pl.diffuse = [
				ld.diffuse[0],
				ld.diffuse[1],
				ld.diffuse[2]
			];
			if (ld.specular) pl.specular = [
				ld.specular[0],
				ld.specular[1],
				ld.specular[2]
			];
			if (ld.range != null) pl.range = ld.range;
			const { excludedMeshesIds: ex, includedOnlyMeshesIds: io } = ld;
			if (ex?.length) pl.excludedMeshIds = new Set(ex);
			if (io?.length) pl.includedOnlyMeshIds = new Set(io);
			lights.push(pl);
		}
	}
	const allMeshes = [];
	const nodeMap = /* @__PURE__ */ new Map();
	const meshesByNodeId = /* @__PURE__ */ new Map();
	const childNodeIds = /* @__PURE__ */ new Set();
	if (data.meshes) {
		const maxMeshes = opts.maxMeshes ?? Infinity;
		let meshCount = 0;
		const bakeLocalMatrix = data.meshes.some((m) => m.localMatrix) ? (await import("./bake-local-matrix.js")).bakeLocalMatrix : null;
		for (const md of data.meshes) {
			if (meshCount >= maxMeshes) break;
			if (md.isVisible === false) continue;
			if (md.positions && md.normals && md.indices && md.indices.length > 0) {
				const positions = new F32(md.positions);
				const normals = new F32(md.normals);
				const allIndices = new U32(md.indices);
				const uvs = md.uvs ? new F32(md.uvs) : void 0;
				const uvs2 = md.uvs2 ? new F32(md.uvs2) : void 0;
				if (md.localMatrix && bakeLocalMatrix) bakeLocalMatrix(positions, normals, md.localMatrix);
				let matIds = null;
				if (md.materialId) matIds = multiMatMap.get(md.materialId) ?? [md.materialId];
				const subMeshes = md.subMeshes ?? [{
					materialIndex: 0,
					verticesStart: 0,
					verticesCount: positions.length / 3,
					indexStart: 0,
					indexCount: allIndices.length
				}];
				let firstMesh = null;
				for (const sub of subMeshes) {
					if (sub.indexCount === 0) continue;
					const subIndices = allIndices.slice(sub.indexStart, sub.indexStart + sub.indexCount);
					const gpu = uploadMeshToGPU(engine, positions, normals, subIndices, uvs, uvs2);
					let mat;
					if (matIds && sub.materialIndex < matIds.length) mat = materialMap.get(matIds[sub.materialIndex]) ?? createStandardMaterial();
					else if (matIds && matIds.length === 1) mat = materialMap.get(matIds[0]) ?? createStandardMaterial();
					else mat = createStandardMaterial();
					const mesh = initMeshTransform({
						name: md.name + (subMeshes.length > 1 ? `_sub${sub.materialIndex}` : ""),
						id: md.id,
						material: mat,
						receiveShadows: false,
						_gpu: gpu
					}, md.position?.[0] ?? 0, md.position?.[1] ?? 0, md.position?.[2] ?? 0, md.rotation?.[0] ?? 0, md.rotation?.[1] ?? 0, md.rotation?.[2] ?? 0, md.scaling?.[0] ?? 1, md.scaling?.[1] ?? 1, md.scaling?.[2] ?? 1);
					mesh._cpuPositions = positions;
					mesh._cpuNormals = normals;
					mesh._cpuUvs = uvs;
					mesh._cpuIndices = subIndices;
					allMeshes.push(mesh);
					if (!meshesByNodeId.has(md.id)) meshesByNodeId.set(md.id, []);
					meshesByNodeId.get(md.id).push(mesh);
					if (firstMesh === null) firstMesh = mesh;
					meshCount++;
				}
				if (firstMesh !== null) nodeMap.set(md.id, firstMesh);
			} else {
				const rx = md.rotation?.[0] ?? 0, ry = md.rotation?.[1] ?? 0, rz = md.rotation?.[2] ?? 0;
				const cx = Math.cos(rx * .5), sx_ = Math.sin(rx * .5);
				const cy = Math.cos(ry * .5), sy_ = Math.sin(ry * .5);
				const cz = Math.cos(rz * .5), sz_ = Math.sin(rz * .5);
				const qx = sx_ * cy * cz + cx * sy_ * sz_;
				const qy = cx * sy_ * cz - sx_ * cy * sz_;
				const qz = cx * cy * sz_ + sx_ * sy_ * cz;
				const qw = cx * cy * cz - sx_ * sy_ * sz_;
				const tn = createTransformNode(md.name, md.position?.[0] ?? 0, md.position?.[1] ?? 0, md.position?.[2] ?? 0, qx, qy, qz, qw, md.scaling?.[0] ?? 1, md.scaling?.[1] ?? 1, md.scaling?.[2] ?? 1);
				nodeMap.set(md.id, tn);
			}
		}
		for (const md of data.meshes) {
			if (md.isVisible === false || !md.parentId) continue;
			const parent = nodeMap.get(md.parentId);
			if (!parent) continue;
			childNodeIds.add(md.id);
			const childMeshes = meshesByNodeId.get(md.id) ?? [];
			for (const child of childMeshes) {
				child.parent = parent;
				parent.children.push(child);
			}
			if (childMeshes.length === 0) {
				const childNode = nodeMap.get(md.id);
				if (childNode) {
					childNode.parent = parent;
					parent.children.push(childNode);
				}
			}
		}
	}
	const camData = opts.loadCamera !== false && data.cameras?.length ? (data.activeCameraID ? data.cameras.find((c) => c.id === data.activeCameraID) : null) ?? data.cameras[0] : null;
	const camera = camData ? (await import("./parse-camera.js")).parseBabylonCamera(camData) : void 0;
	const rootMeshes = allMeshes.filter((m) => !childNodeIds.has(m.id));
	const rootTransformNodes = [];
	for (const [id, node] of nodeMap) if (!childNodeIds.has(id) && !meshesByNodeId.has(id)) rootTransformNodes.push(node);
	return {
		entities: [
			...lights,
			...rootMeshes,
			...rootTransformNodes
		],
		clearColor,
		camera
	};
}
export { loadBabylon };

//# sourceMappingURL=load-babylon.js.map