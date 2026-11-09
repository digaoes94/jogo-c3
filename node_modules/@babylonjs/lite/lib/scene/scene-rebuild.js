import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
// src/scene/scene-rebuild.ts
var byOrder = (a, b) => a.order - b.order;
/** Reconcile+build passes an all-family rebuild will run while group membership keeps drifting. Drift can
*  only be introduced by application code that re-materials a mesh from inside an awaited material build, so
*  two passes settle every realistic case; the bound only exists so a pathological builder cannot spin. */
var MAX_RECONCILE_PASSES = 8;
/** Rebuild entry point re-armed when a group had to be given up on. Self-import: this module is already
*  loaded at that point, so it costs no extra chunk. */
var rearmRebuild = (scene) => rebuildSceneRenderables(scene);
/**
* Rebuild the PBR material group(s) of a scene in place, recompiling their pipelines.
*
* Needed after a scene-wide COMPILE-TIME PBR shader feature changes — tone mapping being
* the first case. `rebuildMaterial` cannot do this: it reuses the per-scene composer
* closure captured at build time (which already baked in the tone-mapping decision), so
* it only rebuilds bind groups/pipelines from the SAME shader source. This re-runs the
* group builder from scratch, so the scene-wide feature scan and WGSL composition run
* again with the current `imageProcessing` configuration.
*
* Scoped to the PBR family (the only family whose shaders bake image-processing state).
* PBR group builders return no scene-UBO updater, so none is re-registered here; if this
* is ever generalized to families that own an updater, updater replacement must be added.
*
* No-op before the scene's initial build has run (nothing to rebuild yet).
*
* @param scene - The scene whose PBR pipelines should be rebuilt.
*/
async function rebuildScenePbrPipelines(scene, force = false) {
	await rebuildSceneGroups(scene, "pbr", force);
}
/**
* Rebuild EVERY material group of a built scene in place so renderables pick up the scene's current
* light/shadow topology.
*
* Renderables bake scene-wide state at build time: the per-mesh light INDEX list, the single- vs
* multi-light shader permutation, whether a mesh receives shadows, and the shadow bind group of the
* generator attached to each light. Light data itself is uploaded every frame, but none of that baked
* state follows a light being added, removed, or swapped — this re-runs the group builders so it does.
*
* Called automatically when a scene whose topology changed is registered again, so the usual flow is
* `unregisterScene` → mutate lights → `registerScene*`. Call it directly to apply a change to a scene
* that stays registered.
*
* Only group-owned renderables are replaced: feature-owned entries in `scene._renderables` (skybox,
* ground, HDR backdrop, Gaussian splats) are preserved. Node materials that captured their shadow
* generators at parse time keep those references and are out of scope.
*
* No-op before the scene's initial build has run.
*
* @param scene - The scene to rebuild.
*/
async function rebuildSceneRenderables(scene) {
	await rebuildSceneGroups(scene, void 0, false);
}
/** @internal Shared group-rebuild core. `family` restricts the rebuild to one material family
*  (`undefined` rebuilds every family). */
async function rebuildSceneGroups(scene, family, force) {
	const ctx = scene;
	if (!ctx._built && !force) return;
	const generation = ctx._lightListVersion ?? 0;
	const engine = ctx.surface.engine;
	const retireOld = (disposers) => {
		if (ctx._z) disposers.forEach((dispose) => dispose());
		else retireGpuResources(engine, () => disposers.forEach((dispose) => dispose()));
	};
	let changed = false;
	let aborted = false;
	let completed = false;
	let rearmed = false;
	try {
		for (let pass = 1;; pass++) {
			if (family !== void 0) {
				await rebuildEachGroup();
				break;
			}
			reconcileGroups(ctx);
			await rebuildEachGroup();
			if (!membershipDrifted(ctx)) break;
			if (pass >= MAX_RECONCILE_PASSES) {
				ctx._rebuildHook = rearmRebuild;
				rearmed = true;
				aborted = true;
				break;
			}
		}
		completed = true;
	} finally {
		if (changed) {
			ctx._renderables.sort(byOrder);
			ctx._renderableVersion++;
			ctx._materialEpoch++;
			if (ctx._built) ctx._frameGraph.build();
		}
		if (family === void 0 && completed && !aborted && (ctx._lightListVersion ?? 0) === generation) {
			const pending = ctx._pendingTopologyRetirements?.splice(0);
			if (pending?.length) retireOld(pending);
			if (!rearmed) ctx._rebuildHook = void 0;
		}
	}
	async function rebuildEachGroup() {
		for (const [builder, meshes] of ctx._groups) {
			if (family !== void 0 && builder._materialFamily !== family) continue;
			if (meshes.length === 0) {
				if (meshes.o || meshes.r) {
					dropGroupOutput(builder, meshes);
					changed = true;
				}
				continue;
			}
			const runtime = ctx._runtimeBuilds;
			await runtime?.wait(meshes);
			let unstable = false;
			const rebuild = async () => {
				const buildHooks = ctx._runtimeBuilds;
				const groupMeshes = [...meshes].filter((mesh) => ctx.meshes.includes(mesh) && mesh.material?._buildGroup === builder);
				if (groupMeshes.length === 0) {
					dropGroupOutput(builder, meshes);
					return;
				}
				const hadBuiltGroup = !!meshes.r;
				const cleanupStart = ctx._disposables.length;
				const oldByMesh = /* @__PURE__ */ new Map();
				const materials = new Map(groupMeshes.map((mesh) => [mesh, mesh.material]));
				for (const mesh of groupMeshes) {
					const disposers = ctx._meshDisposables.get(mesh);
					if (disposers) {
						oldByMesh.set(mesh, disposers);
						ctx._meshDisposables.delete(mesh);
						buildHooks?.holdPendingDisposers(mesh, disposers);
					}
				}
				let result;
				let transmission;
				ctx._p = (value) => {
					transmission = value;
					return true;
				};
				try {
					result = await builder(ctx, groupMeshes);
				} catch (error) {
					transmission?.[1]();
					for (const mesh of groupMeshes) {
						const previous = oldByMesh.get(mesh);
						const built = ctx._meshDisposables.get(mesh);
						if (built && built !== previous) for (const dispose of built) dispose();
						const live = ctx.meshes.includes(mesh) && mesh.material === materials.get(mesh) && mesh.material?._buildGroup === builder && meshes.includes(mesh);
						if (previous && live) ctx._meshDisposables.set(mesh, previous);
						else {
							ctx._meshDisposables.delete(mesh);
							if (previous) retireOld(previous);
						}
						if (previous) buildHooks?.releasePendingDisposers(mesh, previous);
					}
					throw error;
				} finally {
					delete ctx._p;
				}
				if (ctx._z || runtime?._d()) {
					transmission?.[1]();
					for (const mesh of groupMeshes) {
						const built = ctx._meshDisposables.get(mesh);
						const previous = oldByMesh.get(mesh);
						if (built && built !== previous) for (const dispose of built) dispose();
						ctx._meshDisposables.delete(mesh);
					}
					for (const dispose of ctx._disposables.splice(0)) dispose();
					const oldDisposers = [...oldByMesh.values()].flat();
					retireOld(oldDisposers);
					for (const [mesh, disposers] of oldByMesh) buildHooks?.releasePendingDisposers(mesh, disposers);
					return;
				}
				transmission?.[0]();
				builder._rebuildSingle = result.rebuildSingle;
				meshes.r = ctx._runtimeBuilds?.base(builder, result.rebuildSingle) ?? result.rebuildSingle;
				if (result._w !== void 0) meshes._w = result._w;
				if (hadBuiltGroup) dedupeGroupCleanup(ctx, cleanupStart);
				const liveMeshes = new Set(groupMeshes.filter((mesh) => ctx.meshes.includes(mesh) && mesh.material === materials.get(mesh) && mesh.material?._buildGroup === builder && meshes.includes(mesh)));
				if (liveMeshes.size !== groupMeshes.length && result.renderables.some((renderable) => !renderable.mesh)) {
					for (const mesh of groupMeshes) {
						const built = ctx._meshDisposables.get(mesh);
						const previous = oldByMesh.get(mesh);
						if (built && built !== previous) for (const dispose of built) dispose();
						if (previous && ctx.meshes.includes(mesh)) ctx._meshDisposables.set(mesh, previous);
						else {
							ctx._meshDisposables.delete(mesh);
							if (previous) retireOld(previous);
						}
						if (previous) buildHooks?.releasePendingDisposers(mesh, previous);
					}
					unstable = true;
					return;
				}
				const rebuiltMaterials = /* @__PURE__ */ new Set();
				for (const mesh of groupMeshes) {
					if (!liveMeshes.has(mesh)) {
						const previous = oldByMesh.get(mesh);
						const built = ctx._meshDisposables.get(mesh);
						if (built && built !== previous) for (const dispose of built) dispose();
						if (previous && ctx.meshes.includes(mesh)) {
							ctx._meshDisposables.set(mesh, previous);
							oldByMesh.delete(mesh);
							buildHooks?.releasePendingDisposers(mesh, previous);
						} else ctx._meshDisposables.delete(mesh);
						continue;
					}
					rebuiltMaterials.add(mesh.material);
					mesh._renderableGen = -~mesh._renderableGen;
					ctx._runtimeBuilds?.reset(mesh);
				}
				for (const material of rebuiltMaterials) material._csmGen = (material._csmGen ?? 0) + 1;
				const stale = meshes.o;
				const staleSet = stale?.length ? new Set(stale) : null;
				for (let i = ctx._renderables.length - 1; i >= 0; i--) {
					const existing = ctx._renderables[i];
					if (liveMeshes.has(existing.mesh) || staleSet?.has(existing)) ctx._renderables.splice(i, 1);
				}
				const kept = result.renderables.filter((renderable) => !renderable.mesh || liveMeshes.has(renderable.mesh));
				ctx._renderables.push(...kept);
				meshes.o = kept;
				const oldDisposers = [...oldByMesh.values()].flat();
				retireOld(oldDisposers);
				for (const [mesh, disposers] of oldByMesh) buildHooks?.releasePendingDisposers(mesh, disposers);
			};
			const { X } = await import("./scene-runtime-mesh-build.js");
			const MAX_ATTEMPTS = 3;
			for (let attempt = 1;; attempt++) {
				unstable = false;
				await X(ctx, builder, rebuild);
				if (ctx._z || runtime?._d()) {
					aborted = true;
					return;
				}
				if (!unstable) break;
				if (attempt >= MAX_ATTEMPTS) {
					dropGroupOutput(builder, meshes);
					ctx._rebuildHook = rearmRebuild;
					rearmed = true;
					aborted = true;
					break;
				}
			}
			if (unstable) {
				changed = true;
				continue;
			}
			changed = true;
		}
	}
	/** True when a live mesh is not in the group of the builder its CURRENT material belongs to — i.e. a
	*  material swap landed while a build was awaited, so the traversal must run again. */
	function membershipDrifted(scene) {
		for (const mesh of scene.meshes) {
			const build = mesh.material?._buildGroup;
			if (build && !scene._groups.get(build)?.includes(mesh)) return true;
		}
		return false;
	}
	/** Move every live mesh into the group of the builder its CURRENT material belongs to, creating groups as
	*  needed and leaving empty ones behind (the loop drops their stale output). Only used by the all-family
	*  topology rebuild: a family-scoped rebuild must not reshuffle groups it does not rebuild. */
	function reconcileGroups(scene) {
		const wanted = /* @__PURE__ */ new Map();
		for (const mesh of scene.meshes) {
			const build = mesh.material?._buildGroup;
			if (!build) continue;
			const list = wanted.get(build);
			if (list) list.push(mesh);
			else wanted.set(build, [mesh]);
		}
		for (const [build, group] of scene._groups) {
			const next = wanted.get(build) ?? [];
			if (group.length !== next.length || next.some((mesh, i) => group[i] !== mesh)) {
				group.length = 0;
				group.push(...next);
			}
			wanted.delete(build);
		}
		for (const [build, next] of wanted) {
			const group = next;
			scene._groups.set(build, group);
		}
	}
	/** Drop a group's tracked output from the scene: used when the group has no live member left, and as the
	*  give-up path when a merged build keeps racing concurrent mutation. Drawing nothing is the only safe
	*  option once the renderable's source meshes may have had their GPU buffers freed. */
	function dropGroupOutput(builder, meshes) {
		const owned = meshes.o;
		if (owned?.length) {
			const ownedSet = new Set(owned);
			for (let i = ctx._renderables.length - 1; i >= 0; i--) if (ownedSet.has(ctx._renderables[i])) ctx._renderables.splice(i, 1);
		}
		meshes.o = void 0;
		meshes.r = void 0;
		ctx._runtimeBuilds?.dropBase(builder);
		ctx._rebuildHook = rearmRebuild;
		rearmed = true;
	}
	function dedupeGroupCleanup(scene, start) {
		const existing = new Set(scene._disposables.slice(0, start));
		for (let i = scene._disposables.length - 1; i >= start; i--) if (existing.has(scene._disposables[i])) scene._disposables.splice(i, 1);
	}
}
export { rebuildScenePbrPipelines, rebuildSceneRenderables };

//# sourceMappingURL=scene-rebuild.js.map