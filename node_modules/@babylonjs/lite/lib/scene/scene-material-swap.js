import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
// src/scene/scene-material-swap.ts
/** @internal Drain _materialSwapQueue: dispose old resources and rebuild renderables. */
function processMaterialSwaps(scene) {
	const q = scene._materialSwapQueue;
	if (!q[0] || scene._runtimeBuilds?.w) return;
	let changed;
	let pending;
	let firstBuilds;
	const renderables = scene._renderables;
	for (const mesh of q) {
		const mat = mesh.material;
		if (!mat) continue;
		const runtimeBuild = mesh._runtimeThinBuild;
		if (runtimeBuild) {
			pending = runtimeBuild(scene, mesh, pending);
			continue;
		}
		const group = scene._groups.get(mat._buildGroup);
		const rebuild = group?.r;
		if (!rebuild) {
			(firstBuilds ??= []).push(mesh);
			continue;
		}
		if (group._w?.(mesh)) {
			(firstBuilds ??= []).push([mesh, mat]);
			continue;
		}
		const old = scene._meshDisposables.get(mesh);
		if (old) {
			scene._meshDisposables.delete(mesh);
			retireGpuResources(scene.surface.engine, () => old.forEach((fn) => fn()));
		}
		const o = group.o;
		let dead;
		for (let i = renderables.length; i--;) if (renderables[i].mesh === mesh) dead = renderables.splice(i, 1)[0];
		mesh._renderableGen = -~mesh._renderableGen;
		const built = rebuild(scene, mesh);
		if (o) {
			const oi = o.indexOf(dead);
			oi < 0 ? o.push(built) : o[oi] = built;
		}
		changed = renderables.push(built);
	}
	if (changed) {
		renderables.sort((a, b) => a.order - b.order);
		scene._renderableVersion++;
		scene._materialEpoch++;
	}
	q.length = 0;
	if (!firstBuilds) return pending;
	const builds = firstBuilds;
	return import("./scene-runtime-mesh-build.js").then(({ C }) => C(scene, builds, pending), (error) => {
		const hooks = scene._runtimeBuilds;
		if (hooks) hooks._x(error);
		else console.error(error);
	});
}
export { processMaterialSwaps };

//# sourceMappingURL=scene-material-swap.js.map