import { enableDeformableShadowBounds, getPreviousDeformableShadowBounds } from "./deformable-shadow-casters.js";
import { buildSkinnedBoneCorners, growCornersByMatrix, setExtentCorners } from "../mesh/aabb-corners.js";
// src/shadow/enable-skeleton-shadows.ts
var caches = null;
function getCache(mesh) {
	const skeleton = mesh.skeleton;
	if (!skeleton?.weights || !skeleton.boneMatrices) return null;
	const cache = (caches ??= /* @__PURE__ */ new WeakMap()).get(mesh);
	if (cache && cache.positions === mesh._cpuPositions && cache.skeleton === skeleton && cache.joints === skeleton.joints && cache.weights === skeleton.weights && cache.joints1 === skeleton.joints1 && cache.weights1 === skeleton.weights1) return cache;
	const boxes = buildSkinnedBoneCorners(mesh);
	const base = boxes ? [[
		Infinity,
		Infinity,
		Infinity
	], [
		-Infinity,
		-Infinity,
		-Infinity
	]] : null;
	for (const box of boxes ?? []) for (let axis = 0; axis < 3; axis++) {
		base[0][axis] = Math.min(base[0][axis], box.corners[axis]);
		base[1][axis] = Math.max(base[1][axis], box.corners[21 + axis]);
	}
	const next = {
		positions: mesh._cpuPositions,
		skeleton,
		joints: skeleton.joints,
		weights: skeleton.weights,
		joints1: skeleton.joints1,
		weights1: skeleton.weights1,
		boxes,
		base,
		composedCorners: /* @__PURE__ */ new Float32Array(24),
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
	caches.set(mesh, next);
	return next;
}
function createSkeletonBoundsProvider(generator) {
	return {
		kind: "skeleton",
		applies: (mesh) => !!mesh.skeleton?.weights && !!mesh.skeleton.boneMatrices,
		getLocalBounds(mesh) {
			const bounds = getPreviousDeformableShadowBounds(generator, mesh, "skeleton");
			const cache = getCache(mesh);
			const boneMatrices = mesh.skeleton?.boneMatrices;
			if (!cache?.boxes || !boneMatrices) return bounds;
			const min = cache.result[0];
			const max = cache.result[1];
			if (bounds && cache.base) {
				for (let axis = 0; axis < 3; axis++) {
					min[axis] = Math.min(bounds[0][axis], cache.base[0][axis]);
					max[axis] = Math.max(bounds[1][axis], cache.base[1][axis]);
				}
				setExtentCorners(cache.composedCorners, min, max);
			}
			min[0] = min[1] = min[2] = Infinity;
			max[0] = max[1] = max[2] = -Infinity;
			for (const box of cache.boxes) growCornersByMatrix(bounds ? cache.composedCorners : box.corners, boneMatrices, min, max, box.boneIndex * 16);
			return Number.isFinite(min[0]) ? cache.result : bounds;
		}
	};
}
/** Enable live skeletal bounds for one shadow generator. */
function enableSkeletonShadows(generator) {
	enableDeformableShadowBounds(generator, createSkeletonBoundsProvider(generator));
}
export { enableSkeletonShadows };

//# sourceMappingURL=enable-skeleton-shadows.js.map