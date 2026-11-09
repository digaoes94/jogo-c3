import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
import { getMaterialSource, isMaterialView } from "./material-view.js";
import { resolveMeshRebuild } from "./resolve-mesh-rebuild.js";
import { processMaterialSwaps } from "../scene/scene-material-swap.js";
// src/material/material-rebuild.ts
/** The PBR check: the first PBR material rebuild starts importing it and rebuilds the group; later ones call it. */
var _rebuildsComposed;
/** Rebuild renderables whose pipeline/bind-group feature state depends on a material.
*  Use after texture, sampler, bind-group layout, culling, or feature changes.
*  UBO-only scalar/vector changes should use markMaterialUboDirty instead. */
function rebuildMaterial(scene, materialOrView, options) {
	const completion = rebuildMaterialRenderables(scene, materialOrView, options);
	if (completion) completion.catch((error) => {
		scene._runtimeBuilds?._x(error);
		console.error(error);
	});
	return completion;
}
function rebuildMaterialRenderables(scene, materialOrView, options) {
	const source = getMaterialSource(materialOrView);
	source._renderFeatures = void 0;
	const rebuildViews = options?.rebuildViews !== false;
	const pending = [];
	const extra = scene._materialRebuild?.((material) => matchesMaterial(material, source, materialOrView, rebuildViews));
	if (extra) pending.push(extra);
	const targets = scene.meshes.filter((mesh) => matchesMaterial(mesh.material, source, materialOrView, rebuildViews));
	const pbr = targets.filter((mesh) => mesh.material._buildGroup._materialFamily === "pbr");
	let perMesh = false;
	if (pbr[0] && _rebuildsComposed) try {
		perMesh = _rebuildsComposed(scene, pbr);
	} catch (error) {
		pending.push(Promise.reject(error));
	}
	else if (pbr[0]) import("./pbr/pbr-built-variant.js").then(({ _pbrRebuildsComposed }) => {
		_rebuildsComposed = _pbrRebuildsComposed;
	}, () => void 0);
	if (perMesh) {
		const swapped = new Set(pbr);
		rebuildEach(scene, targets.filter((mesh) => !swapped.has(mesh)), pending);
		swapNow(scene, pbr, pending);
	} else rebuildEach(scene, targets, pending);
	if (pending.length > 0) return Promise.all(pending).then(() => {
		if (options?.rebuildFrameGraph) scene._frameGraph.build();
	});
	else if (options?.rebuildFrameGraph) scene._frameGraph.build();
}
function matchesMaterial(meshMaterial, source, materialOrView, rebuildViews) {
	if (!meshMaterial) return false;
	if (!rebuildViews) return meshMaterial === materialOrView;
	return meshMaterial === source || isMaterialView(meshMaterial) && meshMaterial.source === source;
}
/** Rebuild each mesh through its family's path, collecting the asynchronous rebuilds in `pending`. */
function rebuildEach(scene, meshes, pending) {
	let changed = false;
	for (const mesh of meshes) {
		const rebuilt = rebuildSceneMesh(scene, mesh);
		if (typeof rebuilt !== "boolean") pending.push(rebuilt);
		else if (rebuilt && mesh.material) {
			mesh.material._csmGen = (mesh.material._csmGen ?? 0) + 1;
			mesh._renderableGen = -~mesh._renderableGen;
			changed = true;
		}
	}
	if (changed) {
		scene._renderableVersion++;
		scene._materialEpoch++;
	}
}
/** Drain the material-swap queue for `meshes` alone, now: each is rebuilt through its group closure, as a material
*  assignment is. Meshes queued for other reasons keep their place for the next frame's drain. */
function swapNow(scene, meshes, pending) {
	const queue = scene._materialSwapQueue;
	const own = new Set(meshes);
	const others = queue.filter((mesh) => !own.has(mesh));
	queue.length = 0;
	queue.push(...meshes);
	try {
		const drained = processMaterialSwaps(scene);
		if (drained) pending.push(drained);
	} catch (error) {
		queue.length = 0;
		pending.push(Promise.reject(error));
		rebuildEach(scene, meshes, pending);
	} finally {
		queue.push(...others);
	}
}
function rebuildSceneMesh(ctx, mesh) {
	const material = mesh.material;
	if (!material) return false;
	const builder = material._buildGroup;
	const group = ctx._groups.get(builder);
	const preload = material._uvTxExt;
	if (preload || mesh._runtimeThinBuild || ctx._runtimeBuilds?.w || builder._materialFamily === "pbr" && (ctx._built || group?.r)) {
		if (!ctx._built && !group?.r) return false;
		return Promise.resolve(preload).then(() => import("../scene/scene-runtime-mesh-build.js")).then(({ B }) => B(ctx, builder, mesh)).then(() => ctx._runtimeBuilds?._e(false));
	}
	const resolved = resolveMeshRebuild(ctx, builder);
	if (!resolved) return false;
	const old = ctx._meshDisposables.get(mesh);
	if (old) {
		ctx._meshDisposables.delete(mesh);
		for (const dispose of old) {
			const lifetimeIndex = ctx._disposables.indexOf(dispose);
			if (lifetimeIndex >= 0) ctx._disposables.splice(lifetimeIndex, 1);
			const packet = dispose.p;
			if (packet) {
				packet._disposed = true;
				const owner = packet._owner;
				if (owner) {
					const index = owner.indexOf(packet);
					if (index >= 0) owner.splice(index, 1);
					packet._owner = void 0;
					if (owner.length === 0) packet._onOwnerEmpty?.();
				} else packet._onOwnerEmpty?.();
				if (packet._onOwnerEmpty) packet._onOwnerEmpty = void 0;
			}
		}
		retireGpuResources(ctx.surface.engine, () => old.forEach((fn) => fn()));
	}
	for (let i = ctx._renderables.length - 1; i >= 0; i--) if (ctx._renderables[i].mesh === mesh) ctx._renderables.splice(i, 1);
	const renderable = resolved(ctx, mesh);
	let i = ctx._renderables.length;
	while (i > 0 && ctx._renderables[i - 1].order > renderable.order) i--;
	ctx._renderables.splice(i, 0, renderable);
	return true;
}
export { rebuildMaterial };

//# sourceMappingURL=material-rebuild.js.map