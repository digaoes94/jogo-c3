import { retain } from "../resource/ref-count.js";
// src/loader-gltf/gltf-share.ts
/** Upload nodes that reference the same glTF primitive with one shared geometry.
*  This module is imported only for assets that actually repeat a mesh index. */
async function share(meshDatas, buildMaterial, buildTightMesh, meshFeatures, ctx) {
	const { _engine: engine, _json: json } = ctx;
	const activeNodes = getActiveNodes(json);
	shareCpuGeometry(meshDatas, activeNodes);
	const materials = await Promise.all(meshDatas.map((m) => buildMaterial(m._material)));
	const interleave = meshDatas.some((m) => m._vb) ? await import("./gltf-interleave.js") : void 0;
	const geometryCache = /* @__PURE__ */ new Map();
	const meshes = meshDatas.map((m, i) => {
		const material = materials[i];
		const meshName = json.meshes[json.nodes[m._nodeIndex].mesh].name || `gltf_mesh_${i}`;
		const active = activeNodes.has(m._nodeIndex);
		const source = active ? geometryCache.get(m._primitive) : void 0;
		const mesh = m._vb ? interleave.buildInterleavedMesh(engine, m, i, material, meshName, source) : buildTightMesh(engine, m, material, meshName, source);
		mesh._authoredSign = -1;
		if (source) {
			_installSharedRecovery(source._gpu);
			retain(mesh._gpu);
		} else if (active) geometryCache.set(m._primitive, mesh);
		return mesh;
	});
	if (meshFeatures.length > 0) await Promise.all(meshes.flatMap((mesh, i) => meshFeatures.map((feature) => feature.applyMesh(meshDatas[i], mesh, ctx))));
	return meshes;
}
/** @internal Preserve glTF geometry sharing across replacement GPU devices. */
function _installSharedRecovery(gpu) {
	if (gpu._recoverShared) return;
	let device;
	let rebuilt;
	let owners;
	const recover = (engine, mesh, upload) => {
		if (device === engine._device) {
			if (!owners.has(mesh)) {
				owners.add(mesh);
				retain(rebuilt);
			}
			return rebuilt;
		}
		const next = upload(engine, mesh);
		device = engine._device;
		rebuilt = next;
		owners = new WeakSet([mesh]);
		next._recoverShared = recover;
		return next;
	};
	gpu._recoverShared = recover;
}
function shareCpuGeometry(meshDatas, activeNodes) {
	const cache = /* @__PURE__ */ new Map();
	for (const meshData of meshDatas) {
		if (!activeNodes.has(meshData._nodeIndex)) continue;
		const source = cache.get(meshData._primitive);
		if (!source) {
			cache.set(meshData._primitive, meshData);
			continue;
		}
		const worldMatrix = meshData._worldMatrix;
		const nodeIndex = meshData._nodeIndex;
		const material = meshData._material;
		Object.assign(meshData, source);
		meshData._worldMatrix = worldMatrix;
		meshData._nodeIndex = nodeIndex;
		meshData._material = material;
	}
}
function getActiveNodes(json) {
	const active = /* @__PURE__ */ new Set();
	const pending = [...json.scenes?.[json.scene ?? 0]?.nodes ?? []];
	while (pending.length > 0) {
		const nodeIndex = pending.pop();
		if (!active.has(nodeIndex)) {
			active.add(nodeIndex);
			pending.push(...json.nodes[nodeIndex]?.children ?? []);
		}
	}
	return active;
}
export { _installSharedRecovery, share };

//# sourceMappingURL=gltf-share.js.map