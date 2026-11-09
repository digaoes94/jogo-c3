import { invertMat4 } from "../math/invert-mat4.js";
import { createEmptyPickingInfo } from "./picking-info.js";
// src/picking/ray-pick.ts
/**
* Prepare the scene's pickable meshes for repeated same-frame ray tests.
*
* @internal
*/
function createRayPickSnapshotFromMeshes(meshes, options) {
	const candidates = [];
	const predicate = options?.predicate;
	for (const mesh of meshes) {
		if (!options?.skipPickableCheck && mesh.pickable === false || predicate && !predicate(mesh)) continue;
		const aabb = localAabb(mesh);
		if (!aabb) continue;
		const invWorld = invertMat4(mesh.worldMatrix);
		if (invWorld) candidates.push({
			mesh,
			aabb,
			invWorld
		});
	}
	return { candidates };
}
/** @internal Prepare the scene's pickable meshes for repeated same-frame ray tests. */
function createRayPickSnapshot(scene, options) {
	return createRayPickSnapshotFromMeshes(scene.meshes, options);
}
var _aabbCache = null;
function aabbCache() {
	return _aabbCache ??= /* @__PURE__ */ new WeakMap();
}
/** @internal Compute (and cache) a mesh's local-space AABB from its CPU positions. */
function localAabb(mesh) {
	if (mesh._gpu?._drawRangeSource && mesh._gpu.indexCount === 0) return null;
	const positions = mesh._cpuPositions;
	if (!positions || positions.length < 3) return null;
	const cache = aabbCache();
	const cached = cache.get(positions);
	if (cached) return cached;
	let minX = Infinity, minY = Infinity, minZ = Infinity;
	let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
	for (let i = 0; i < positions.length; i += 3) {
		const x = positions[i], y = positions[i + 1], z = positions[i + 2];
		if (x < minX) minX = x;
		if (y < minY) minY = y;
		if (z < minZ) minZ = z;
		if (x > maxX) maxX = x;
		if (y > maxY) maxY = y;
		if (z > maxZ) maxZ = z;
	}
	const aabb = {
		min: [
			minX,
			minY,
			minZ
		],
		max: [
			maxX,
			maxY,
			maxZ
		]
	};
	cache.set(positions, aabb);
	return aabb;
}
/** @internal Transform a point by a column-major 4×4 matrix (with perspective divide). */
function transformPoint(m, x, y, z, out) {
	const ox = m[0] * x + m[4] * y + m[8] * z + m[12];
	const oy = m[1] * x + m[5] * y + m[9] * z + m[13];
	const oz = m[2] * x + m[6] * y + m[10] * z + m[14];
	const ow = m[3] * x + m[7] * y + m[11] * z + m[15];
	const inv = ow !== 0 ? 1 / ow : 1;
	out[0] = ox * inv;
	out[1] = oy * inv;
	out[2] = oz * inv;
}
/** @internal Transform a direction by a column-major 4×4 matrix (no translation, no divide). */
function transformDir(m, x, y, z, out) {
	out[0] = m[0] * x + m[4] * y + m[8] * z;
	out[1] = m[1] * x + m[5] * y + m[9] * z;
	out[2] = m[2] * x + m[6] * y + m[10] * z;
}
/** @internal Ray/AABB slab test. Returns the nearest positive entry distance (t along
*  the ray, in the ray's own units) or `-1` on a miss. `t` is comparable to world
*  distance because the local ray shares the world ray's parameterisation. On a hit
*  entering from outside the box, `axisOut[0]` is set to the entry slab axis (0/1/2);
*  it stays `-1` when the ray origin is already inside the box (t = 0). */
function rayAabb(ox, oy, oz, dx, dy, dz, aabb, maxT, axisOut) {
	let tmin = 0;
	let tmax = maxT;
	let axis = -1;
	const o = [
		ox,
		oy,
		oz
	];
	const d = [
		dx,
		dy,
		dz
	];
	for (let a = 0; a < 3; a++) {
		const min = aabb.min[a];
		const max = aabb.max[a];
		const dir = d[a];
		const orig = o[a];
		if (Math.abs(dir) < 1e-12) {
			if (orig < min || orig > max) return -1;
		} else {
			const invD = 1 / dir;
			let t1 = (min - orig) * invD;
			let t2 = (max - orig) * invD;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > tmin) {
				tmin = t1;
				axis = a;
			}
			if (t2 < tmax) tmax = t2;
			if (tmin > tmax) return -1;
		}
	}
	axisOut[0] = axis;
	return tmin;
}
/**
* Cast a ray through the scene and return the nearest picked mesh (CPU, synchronous).
*
* @param scene   - The scene whose meshes to test.
* @param ray     - World-space ray (origin, unit direction, length).
* @param options - Optional predicate to restrict pickable meshes.
* @returns A {@link PickingInfo}; `hit` is `false` when nothing is intersected.
*/
function pickWithRaySnapshot(snapshot, ray, options) {
	const info = createEmptyPickingInfo();
	info.ray = ray;
	const predicate = options?.predicate;
	const [ox, oy, oz] = ray.origin;
	const [dx, dy, dz] = ray.direction;
	const localOrigin = [
		0,
		0,
		0
	];
	const localDir = [
		0,
		0,
		0
	];
	const axisOut = [-1];
	let bestT = ray.length;
	let bestMesh = null;
	let bestAxis = -1;
	let bestDirSign = 0;
	let bestInvWorld = null;
	for (const candidate of snapshot.candidates) {
		const mesh = candidate.mesh;
		if (predicate && !predicate(mesh)) continue;
		const { aabb, invWorld } = candidate;
		transformPoint(invWorld, ox, oy, oz, localOrigin);
		transformDir(invWorld, dx, dy, dz, localDir);
		axisOut[0] = -1;
		const t = rayAabb(localOrigin[0], localOrigin[1], localOrigin[2], localDir[0], localDir[1], localDir[2], aabb, bestT, axisOut);
		if (t >= 0 && t < bestT) {
			bestT = t;
			bestMesh = mesh;
			bestAxis = axisOut[0];
			bestDirSign = bestAxis >= 0 ? Math.sign(localDir[bestAxis]) : 0;
			bestInvWorld = invWorld;
		}
	}
	if (bestMesh) {
		info.hit = true;
		info.distance = bestT;
		info.pickedMesh = bestMesh;
		info.pickedPoint = [
			ox + dx * bestT,
			oy + dy * bestT,
			oz + dz * bestT
		];
		if (bestAxis >= 0 && bestInvWorld) {
			const nl = [
				0,
				0,
				0
			];
			nl[bestAxis] = -bestDirSign;
			info.pickedNormal = [
				nl[0],
				nl[1],
				nl[2]
			];
			const iw = bestInvWorld;
			let wnx = iw[0] * nl[0] + iw[1] * nl[1] + iw[2] * nl[2];
			let wny = iw[4] * nl[0] + iw[5] * nl[1] + iw[6] * nl[2];
			let wnz = iw[8] * nl[0] + iw[9] * nl[1] + iw[10] * nl[2];
			const len = Math.hypot(wnx, wny, wnz) || 1;
			wnx /= len;
			wny /= len;
			wnz /= len;
			info.pickedNormalWorld = [
				wnx,
				wny,
				wnz
			];
		}
	}
	return info;
}
/**
* Cast a ray through the scene and return the nearest picked mesh (CPU, synchronous).
*
* @param scene   - The scene whose meshes to test.
* @param ray     - World-space ray (origin, unit direction, length).
* @param options - Optional predicate to restrict pickable meshes.
* @returns A {@link PickingInfo}; `hit` is `false` when nothing is intersected.
*/
function pickWithRay(scene, ray, options) {
	return pickWithRaySnapshot(createRayPickSnapshot(scene, options), ray);
}
/** Cast a ray against an explicit mesh collection instead of a scene's registered mesh list. */
function pickMeshesWithRay(meshes, ray, options) {
	return pickWithRaySnapshot(createRayPickSnapshotFromMeshes(meshes, options), ray);
}
export { createRayPickSnapshot, createRayPickSnapshotFromMeshes, pickMeshesWithRay, pickWithRay, pickWithRaySnapshot };

//# sourceMappingURL=ray-pick.js.map