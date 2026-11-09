import { BU } from "./gpu-flags.js";
import { isRenderingContextRegistered } from "./engine.js";
import { createMappedBuffer } from "../resource/mapped-buffer.js";
import { createEmptyUniformBuffer } from "../resource/empty-uniform-buffer.js";
import { uploadMeshToGPU } from "../mesh/mesh.js";
import { setMeshDrawRangeSource } from "../mesh/mesh-draw-range-state.js";
import { getSceneBindGroupLayout } from "../render/scene-helpers.js";
import { ensureSceneLightState } from "../render/scene-lights-ubo.js";
import "../shader/scene-uniforms-size.js";
// src/engine/recovery-rebuild.ts
/**
* Rebuilds the GPU resources of every registered scene after a WebGPU device
* loss. This whole subtree (mesh geometry, frame-graph tasks, textures,
* skeletons, morph targets) runs only on the recovery path, so it lives here
* behind a single lazy `await import()` from the scene recovery adapter.
* The always-bundled recovery orchestrator therefore carries
* none of it statically, and a recovery-enabled scene only fetches this chunk
* if an actual device loss occurs.
*/
async function rebuildRegisteredScenes(engine) {
	engine._pbrFallbackTex = void 0;
	for (const surface of engine.surfaces) for (const ctx of surface._renderingContexts) {
		if (ctx._kind !== "scene") continue;
		const scene = ctx;
		if (!isRenderingContextRegistered(surface, scene) || scene._z) continue;
		await rebuildSceneGpu(engine, scene);
	}
}
async function rebuildSceneGpu(engine, scene) {
	if (scene._envTextures) {
		const { rebuildSceneEnvironment } = await import("../loader-env/environment-recovery.js");
		await runRecoveryStep("rebuilding environment textures", () => rebuildSceneEnvironment(engine, scene));
	}
	await runRecoveryStep("rebuilding material textures", () => rebuildSceneTextures(engine, scene));
	await runRecoveryStep("rebuilding meshes", () => _rebuildMeshes(engine, scene));
	if (scene._z) return;
	if (scene.shadowGenerators.length > 0 || scene.lights.some((light) => light.shadowGenerator)) {
		const { rebuildSceneShadowGenerators } = await import("../shadow/shadow-recovery.js");
		await runRecoveryStep("rebuilding shadows", () => rebuildSceneShadowGenerators(engine, scene));
	}
	if (scene._z) return;
	const rebuilds = scene._renderables.filter((r) => !!r._rebuild).map((r) => r._rebuild);
	scene._renderables.length = scene._uniformUpdaters.length = 0;
	scene._meshDisposables.clear();
	if (scene._lightGpuState) scene._lightGpuState = void 0;
	for (const [build, meshes] of scene._groups) {
		const result = await runRecoveryStep("rebuilding material groups", () => build(scene, meshes));
		if (scene._z) return;
		meshes.r = scene._runtimeBuilds?.base(build, result.rebuildSingle) ?? result.rebuildSingle;
		if (result._w !== void 0) meshes._w = result._w;
		meshes.o = result.renderables;
		scene._renderables.push(...result.renderables);
		if (result.updater) scene._uniformUpdaters.push(result.updater);
	}
	if (rebuilds.length > 0) scene._renderables.push(...await runRecoveryStep("rebuilding renderables", () => rebuildRenderables(rebuilds)));
	scene._renderables.sort((a, b) => a.order - b.order);
	scene._renderableVersion++;
	resetFrameGraphTasks(engine, scene);
	scene._frameGraph.build();
}
/**
* @internal Replay discovered rebuild thunks, preserving their pre-loss relative order.
*
* Sequential rather than concurrent: each thunk re-runs its builder, which allocates GPU resources
* on the replacement device, and the surrounding recovery steps are ordered for the same reason.
*/
async function rebuildRenderables(rebuilds) {
	const rebuilt = [];
	for (const rebuild of rebuilds) {
		const renderable = await rebuild();
		if (renderable) rebuilt.push(renderable);
	}
	return rebuilt;
}
async function runRecoveryStep(description, action) {
	try {
		return await action();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Device-lost Scene recovery failed while ${description}: ${message}`, { cause: error });
	}
}
function resetFrameGraphTasks(engine, scene) {
	for (const task of scene._frameGraph._tasks) {
		if (!("_sceneUBO" in task && "_targetSignature" in task && "_opaqueBindings" in task)) continue;
		const rt = task;
		rt._sceneUBO = createEmptyUniformBuffer(engine, 368);
		rt._lightsUBO = ensureSceneLightState(engine, scene)._buffer;
		rt._sceneBG = engine._device.createBindGroup({
			layout: getSceneBindGroupLayout(engine),
			entries: [{
				binding: 0,
				resource: { buffer: rt._sceneUBO }
			}, {
				binding: 1,
				resource: { buffer: rt._lightsUBO }
			}]
		});
		rt._opaqueBindings.length = 0;
		rt._directBindings.length = 0;
		rt._transparentBindings.length = 0;
		rt._ob.length = 0;
		rt._lastVersion = -1;
		rt._sceneUboCacheKey.length = 0;
	}
}
/** @internal Rebuild retained mesh resources after a device loss. */
async function _rebuildMeshes(engine, scene) {
	let skeletonFactory = null;
	let morphFactory = null;
	for (const mesh of scene.meshes) {
		if (mesh._cpuPositions && mesh._cpuNormals && mesh._cpuIndices) {
			const recoverShared = mesh._gpu._recoverShared;
			mesh._gpu = recoverShared ? recoverShared(engine, mesh, uploadRetainedMesh) : uploadRetainedMesh(engine, mesh);
		}
		if (mesh.skeleton) {
			skeletonFactory ??= (await import("../skeleton/create-skeleton.js")).createSkeleton;
			const old = mesh.skeleton;
			const rebuilt = skeletonFactory(engine, old.joints, old.weights, old.boneCount, old.boneMatrices, old.joints1, old.weights1);
			Object.assign(old, rebuilt);
		}
		if (mesh.morphTargets) {
			morphFactory ??= (await import("../morph/create-morph-targets.js")).createMorphTargets;
			const old = mesh.morphTargets;
			const rebuilt = morphFactory(engine, old.targets.map((t) => ({
				positions: t.positions,
				normals: t.normals
			})), mesh._cpuPositions ? mesh._cpuPositions.length / 3 : 0, Array.from(old.weights));
			Object.assign(old, rebuilt);
		}
	}
}
function uploadRetainedMesh(engine, mesh) {
	const old = mesh._gpu;
	const source = old._drawRangeSource;
	if (source) {
		const gpu = uploadMeshToGPU(engine, source.positions, source.normals, source.indices, source.uvs, source.uvs2, source.tangents, source.colors);
		setMeshDrawRangeSource(gpu, { ...source });
		gpu._firstIndex = old._firstIndex;
		gpu._baseVertex = old._baseVertex;
		gpu._vertexCapacity = source.positions.length / 3;
		gpu._indexCapacity = source.indices.length;
		return gpu;
	}
	const positions = mesh._cpuPositions;
	const normals = mesh._cpuNormals;
	const uvs = mesh._cpuUvs;
	const indices = mesh._cpuGpuIndices ?? mesh._cpuIndices;
	const device = engine._device;
	let uvBuffer;
	if (uvs && uvs.length > 0) uvBuffer = createMappedBuffer(engine, uvs, BU.VERTEX);
	else {
		uvBuffer = device.createBuffer({
			size: positions.length / 3 * 8,
			usage: BU.VERTEX,
			mappedAtCreation: true
		});
		uvBuffer.unmap();
	}
	return {
		positionBuffer: createMappedBuffer(engine, positions, BU.VERTEX),
		normalBuffer: createMappedBuffer(engine, normals, BU.VERTEX),
		tangentBuffer: mesh._cpuTangents?.length ? createMappedBuffer(engine, mesh._cpuTangents, BU.VERTEX) : null,
		uvBuffer,
		uv2Buffer: mesh._cpuUv2s ? createMappedBuffer(engine, mesh._cpuUv2s, BU.VERTEX) : null,
		colorBuffer: mesh._cpuColors ? createMappedBuffer(engine, mesh._cpuColors, BU.VERTEX) : null,
		hasUv: !!uvs && uvs.length > 0,
		hasUv2: !!mesh._cpuUv2s && mesh._cpuUv2s.length > 0,
		hasTangent: !!mesh._cpuTangents && mesh._cpuTangents.length > 0,
		hasColor: !!mesh._cpuColors && mesh._cpuColors.length > 0,
		indexBuffer: createMappedBuffer(engine, indices, BU.INDEX),
		indexCount: indices.length,
		indexFormat: mesh._cpuIndexFormat ?? mesh._gpu.indexFormat
	};
}
async function rebuildSceneTextures(engine, scene) {
	const seen = /* @__PURE__ */ new Set();
	const visited = /* @__PURE__ */ new WeakSet();
	const textures = [];
	const visit = (value) => {
		if (!value || typeof value !== "object") return;
		const obj = value;
		if (obj.texture && obj.view && obj.sampler && typeof obj.width === "number" && typeof obj.height === "number") {
			const tex = obj;
			if (!seen.has(tex)) {
				seen.add(tex);
				textures.push(tex);
			}
			return;
		}
		if (visited.has(value)) return;
		visited.add(value);
		for (const child of Object.values(obj)) visit(child);
	};
	for (const mesh of scene.meshes) visit(mesh.material);
	if (textures.length === 0) return;
	const { rebuildTexture2D } = await import("../texture/texture-recovery.js");
	await Promise.all(textures.map((texture) => rebuildTexture2D(engine, texture)));
}
export { _rebuildMeshes, rebuildRegisteredScenes, rebuildRenderables };

//# sourceMappingURL=recovery-rebuild.js.map