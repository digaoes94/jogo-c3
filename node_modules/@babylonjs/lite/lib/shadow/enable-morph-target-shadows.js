import { computeAabb } from "../math/compute-aabb.js";
import { enableDeformableShadowBounds } from "./deformable-shadow-casters.js";
// src/shadow/enable-morph-target-shadows.ts
var caches = null;
function createCache(mesh, morphTargets) {
	const positions = mesh._cpuPositions;
	return {
		positions,
		base: positions?.length ? computeAabb(positions) : mesh.boundMin && mesh.boundMax ? [mesh.boundMin, mesh.boundMax] : null,
		morphTargets,
		targets: morphTargets.targets,
		targetRanges: morphTargets.targets.map((target) => computeAabb(target.positions)),
		result: [[
			0,
			0,
			0
		], [
			0,
			0,
			0
		]]
	};
}
function getCache(mesh, morphTargets) {
	const cache = (caches ??= /* @__PURE__ */ new WeakMap()).get(mesh);
	if (cache && cache.positions === mesh._cpuPositions && cache.morphTargets === morphTargets && cache.targets === morphTargets.targets) return cache;
	const next = createCache(mesh, morphTargets);
	caches.set(mesh, next);
	return next;
}
var morphBoundsProvider = {
	kind: "morph",
	applies: (mesh) => !!mesh.morphTargets,
	getLocalBounds(mesh) {
		const morphTargets = mesh.morphTargets;
		if (!morphTargets) return null;
		const cache = getCache(mesh, morphTargets);
		if (!cache.base) return null;
		const min = cache.result[0];
		const max = cache.result[1];
		for (let axis = 0; axis < 3; axis++) {
			min[axis] = cache.base[0][axis];
			max[axis] = cache.base[1][axis];
		}
		for (let target = 0; target < morphTargets.count; target++) {
			const range = cache.targetRanges[target];
			const weight = morphTargets.weights[target] ?? 0;
			if (!range || !weight) continue;
			const targetMin = weight < 0 ? range[1] : range[0];
			const targetMax = weight < 0 ? range[0] : range[1];
			for (let axis = 0; axis < 3; axis++) {
				min[axis] = min[axis] + targetMin[axis] * weight;
				max[axis] = max[axis] + targetMax[axis] * weight;
			}
		}
		return cache.result;
	}
};
/** Enable live morph-target bounds for one shadow generator. */
function enableMorphTargetShadows(generator) {
	enableDeformableShadowBounds(generator, morphBoundsProvider);
}
export { enableMorphTargetShadows };

//# sourceMappingURL=enable-morph-target-shadows.js.map