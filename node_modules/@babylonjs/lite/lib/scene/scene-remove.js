import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
import { _removeMeshFromRenderTask } from "../frame-graph/render-task-base.js";
import { disposeMeshGpu } from "../mesh/mesh-dispose.js";
import { unregisterMeshScene } from "./mesh-scene-registry.js";
import { _hasSceneChangeHook, _notifySceneChange, _runSceneChange } from "./scene-core.js";
// src/scene/scene-remove.ts
/** Remove an entity from the scene, undoing what `addToScene` did. Accepts the same
*  union as {@link addToScene}: a Mesh, light, camera, shadow generator, transform node,
*  or a whole AssetContainer. Safe to call more than once (idempotent).
*
*  **Mesh GPU lifetime contract.** Removing a mesh from its LAST scene disposes it: it releases
*  its claim on every GPU resource it owns (geometry, skeleton, morph targets, thin instances).
*  Those resources are shared and ref-counted, so each one survives while another owner remains —
*  another scene holding the same mesh, a `cloneTransformNode` clone, or another glTF node sharing
*  the primitive — and is destroyed once the last claim goes away. Either way the mesh itself is
*  retired permanently and `addToScene` throws if it is added back: its buffers may be gone, and
*  releasing a second claim it no longer holds would free buffers a surviving sibling still
*  renders with. Removing a mesh from one of SEVERAL scenes holding it is not a disposal, so
*  re-adding it there is fine. Otherwise create a new mesh — and to hide a mesh temporarily, call
*  `setMeshVisible(mesh, false)` instead of removing it.
*
*  Standalone function for tree-shaking — only included when actually used. */
function removeFromScene(scene, entity) {
	if (_hasSceneChangeHook() && scene._sceneChanges && scene._sceneChanges.depth === 0) {
		_runSceneChange(scene, () => removeFromScene(scene, entity));
		return;
	}
	if ("entities" in entity) {
		const container = entity;
		for (const e of container.entities) removeFromScene(scene, e);
		if (container.camera && scene.camera === container.camera) scene.camera = null;
		const groups = container.animationGroups;
		if (groups?.length) for (const g of groups) spliceOut(scene.animationGroups, g);
		const hook = container._beforeRenderHook;
		if (hook) {
			spliceOut(scene._beforeRender, hook);
			container._beforeRenderHook = void 0;
		}
		const cleanups = container._sceneCleanups;
		if (cleanups) {
			const cleanup = cleanups.get(scene);
			if (cleanup) {
				spliceOut(scene._disposables, cleanup);
				cleanups.delete(scene);
				if (!scene._z) cleanup();
			}
		}
		_notifySceneChange(scene, entity, "removed");
		return;
	}
	if ("_gpu" in entity && "material" in entity) {
		removeMeshFromScene(scene, entity);
		_notifySceneChange(scene, entity, "removed");
		removeChildren(scene, entity);
		return;
	}
	if ("lightType" in entity) {
		spliceOut(scene.lights, entity);
		const sg = entity.shadowGenerator;
		if (sg) disposeShadowGenerator(scene, sg);
		else markTopologyDirty(scene);
	} else if ("fov" in entity && "nearPlane" in entity) {
		if (scene.camera === entity) scene.camera = null;
	} else if ("_shadowType" in entity && "_light" in entity) disposeShadowGenerator(scene, entity);
	detachParent(entity);
	_notifySceneChange(scene, entity, "removed");
	removeChildren(scene, entity);
}
/** Retire a mesh's GPU teardown, but take its DRAW-VISIBILITY bookkeeping out synchronously first.
*
*  A renderable that merges several meshes sharing one material has `mesh: undefined`, so the
*  synchronous `_renderables` sweep in `removeMeshFromScene` cannot find it. Its packet keeps being
*  drawn while `_disposed` is false, so deferring the whole disposer would leave a removed mesh
*  visible until the retirement fence resolves — a frame or more later. Marking the packet disposed
*  and unlinking it from its owner list is pure CPU bookkeeping and safe to do mid-frame; only the
*  actual GPU destruction has to wait. Twin of the detach in `scene-runtime-mesh-build.ts`. */
function retireMeshTeardown(scene, teardown) {
	for (const dispose of teardown) {
		spliceOut(scene._disposables, dispose);
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
	retireSceneGpu(scene, () => {
		for (const fn of teardown) fn();
	});
}
/** Run GPU teardown only after the next frame submission has drained.
*
*  `removeFromScene` is legal from inside `onBeforeRender` — i.e. in the MIDDLE of a frame, before
*  the frame graph records and before `queue.submit`. Destroying a texture or buffer there hits the
*  WebGPU validation errors "Destroyed texture used in a submit" / "Buffer used in submit while
*  destroyed", either via the frame already in flight or, worse, via a renderable rebuilt later in
*  the SAME `_update` (a mesh sharing the removed mesh's material re-acquires a texture whose
*  GPUTexture is already dead — ref-counting cannot resurrect it).
*
*  Deferring also restores make-before-break for shared resources: the rebuild re-acquires the
*  texture (+1) before this release (-1) lands, so the refcount never dips to zero.
*
*  Mirrors `retireOld` in `scene-rebuild.ts` and the retirements in `scene-material-swap.ts` — a
*  scene already being disposed has no further frame to wait for, so it tears down synchronously. */
function retireSceneGpu(scene, teardown) {
	if (scene._z) {
		teardown();
		return;
	}
	retireGpuResources(scene.surface.engine, teardown);
}
/** Drop a shadow generator from the scene and retire its task resources exactly once.
*  The disposable render task lives on the lazily-created task state, not the generator
*  itself; nulling the state afterwards keeps repeat removals a safe no-op.
*
*  The teardown is DEFERRED, not run inline: receiver renderables built before the removal still
*  bind this generator's shadow resources, so they must be replaced by a rebuild first
*  (make-before-break). `rebuildSceneRenderables` drains the queue after the new bind groups exist;
*  `disposeScene` drains it as a fallback when the app never rebuilds. */
function disposeShadowGenerator(scene, sg) {
	spliceOut(scene.shadowGenerators, sg);
	const light = sg._light;
	if (light && light.shadowGenerator === sg) light.shadowGenerator = void 0;
	markTopologyDirty(scene);
	const state = sg._shadowTaskState;
	if (state) {
		sg._shadowTaskState = void 0;
		queueTopologyRetirement(scene, () => state._task.dispose());
	}
}
/** Queue GPU teardown that must wait until a rebuild has replaced the bind groups still referencing it.
*  The first queued entry also registers the scene-dispose fallback, so an app that never rebuilds does not
*  leak the resources — and `disposeScene` itself stays free of any topology-rebuild bytes. */
function queueTopologyRetirement(scene, retirement) {
	if (!scene._pendingTopologyRetirements) {
		scene._pendingTopologyRetirements = [];
		scene._disposables.push(() => drainOnDispose(scene));
	}
	scene._pendingTopologyRetirements.push(retirement);
}
/** Scene-dispose fallback for retirements no rebuild ever drained. Disposing inline would risk
*  "used in submit while destroyed" for a frame still in flight, and the engine's per-frame retirement queue
*  can no longer help (the scene is already unregistered, so `renderFrame` returns before draining it), so
*  wait for the GPU to finish its submitted work first. Falls back to inline when there is no live device. */
function drainOnDispose(scene) {
	const pending = scene._pendingTopologyRetirements?.splice(0);
	if (!pending?.length) return;
	const run = () => {
		for (const dispose of pending) try {
			dispose();
		} catch {}
	};
	const device = scene.surface.engine._device;
	if (device) device.queue.onSubmittedWorkDone().then(run, run);
	else run();
}
/** Flag the scene for a renderable rebuild: the baked light index list, light-count permutation and
*  shadow bind groups no longer match the scene's lights.
*
*  Bumps the light-list version so the lights UBO reuploads even when a light was SWAPPED for another
*  (same count, and the per-light version sums can match), and installs the rebuild entry point that
*  `buildScene` calls on the scene's next registration. The hook keeps the rebuild code out of every
*  scene that never mutates topology — `scene-core` only carries an optional call. */
function markTopologyDirty(scene) {
	scene._lightListVersion = (scene._lightListVersion ?? 0) + 1;
	if (scene._built) scene._rebuildHook = rebuildOnNextBuild;
}
/** Rebuild entry point installed on a topology change. Lazily imported so the rebuild machinery is only
*  fetched by apps that actually mutate a built scene's lights.
*
*  Clears the hook only once the rebuild has completed against the CURRENT topology: the light list is
*  keyed by `_lightListVersion`, so a removal that lands while the rebuild is in flight (or a rebuild that
*  throws) leaves the hook armed for the next registration instead of silently dropping the change. */
async function rebuildOnNextBuild(scene) {
	const { rebuildSceneRenderables } = await import("./scene-rebuild.js");
	await rebuildSceneRenderables(scene);
}
/** Remove the first occurrence of `item` from `arr` if present. */
function spliceOut(arr, item) {
	const i = arr.indexOf(item);
	if (i >= 0) arr.splice(i, 1);
}
/** Clear an entity's `parent` link when it has one, so the world-matrix child registry
*  stops retaining/walking a removed node during parent invalidation. */
function detachParent(node) {
	if (node && typeof node === "object" && "parent" in node) node.parent = null;
}
function removeChildren(scene, node) {
	const kids = node.children;
	if (kids?.length) for (const child of [...kids]) removeFromScene(scene, child);
}
/** Remove a mesh from the scene and destroy its GPU resources.
*  Internal helper — `removeFromScene` dispatches here for the Mesh case. */
function removeMeshFromScene(scene, mesh) {
	scene._meshMaterialChange?.(mesh);
	for (const task of scene._frameGraph._tasks) task._removeMesh?.(mesh);
	const fns = scene._meshDisposables.get(mesh);
	let didMutate = false;
	const teardown = [];
	if (fns) {
		didMutate = true;
		teardown.push(...fns);
		scene._meshDisposables.delete(mesh);
	}
	const mi2 = scene.meshes.indexOf(mesh);
	if (mi2 >= 0) {
		scene.meshes.splice(mi2, 1);
		didMutate = true;
	}
	const i = scene._renderables.findIndex((r) => r.mesh === mesh);
	if (i >= 0) {
		scene._renderables.splice(i, 1);
		didMutate = true;
	}
	if (didMutate) scene._renderableVersion++;
	for (const group of scene._groups.values()) {
		const gi = group.indexOf(mesh);
		if (gi >= 0) group.splice(gi, 1);
		const o = group.o;
		if (o) {
			for (let oi = o.length; oi--;) if (o[oi].mesh === mesh) o.splice(oi, 1);
		}
	}
	const qi = scene._materialSwapQueue.indexOf(mesh);
	if (qi >= 0) scene._materialSwapQueue.splice(qi, 1);
	scene._runtimeBuilds?.remove(mesh);
	mesh.parent = null;
	for (const task of scene._frameGraph._tasks) if ("_renderables" in task) _removeMeshFromRenderTask(task, mesh);
	if (unregisterMeshScene(scene, mesh)) teardown.push(() => disposeMeshGpu(mesh));
	if (teardown.length) retireMeshTeardown(scene, teardown);
}
export { removeFromScene };

//# sourceMappingURL=scene-remove.js.map