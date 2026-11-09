import { _quatFromRotationBasis } from "./create-quat-from-rotation-mat4.js";
// src/math/create-quat-from-look-direction-rh.ts
/**
* Build a unit quaternion that orients local +Z onto `forward` and local +Y onto
* `up`, using a right-handed basis (`right = up × forward`). Matches Babylon.js
* `Quaternion.FromLookDirectionRH`.
* @param forward - Desired forward direction (should be normalized).
* @param up - Desired up direction (should be normalized and not parallel to `forward`).
* @returns A new `{ x, y, z, w }` quaternion.
*/
function createQuatFromLookDirectionRH(forward, up) {
	let fx = forward.x, fy = forward.y, fz = forward.z;
	const fl = Math.hypot(fx, fy, fz) || 1;
	fx /= fl;
	fy /= fl;
	fz /= fl;
	let rx = up.y * fz - up.z * fy;
	let ry = up.z * fx - up.x * fz;
	let rz = up.x * fy - up.y * fx;
	const rl = Math.hypot(rx, ry, rz) || 1;
	rx /= rl;
	ry /= rl;
	rz /= rl;
	const ux = fy * rz - fz * ry;
	const uy = fz * rx - fx * rz;
	const uz = fx * ry - fy * rx;
	return _quatFromRotationBasis(rx, ux, fx, ry, uy, fy, rz, uz, fz);
}
export { createQuatFromLookDirectionRH };

//# sourceMappingURL=create-quat-from-look-direction-rh.js.map