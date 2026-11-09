import { lengthVec3 } from "./length-vec3.js";
// src/math/normalize-vec3.ts
/** Normalize a `Vec3` object, returning `{ x: 0, y: 0, z: 0 }` for degenerate input. */
function normalizeVec3(v) {
	const len = lengthVec3(v);
	if (len <= 1e-10) return {
		x: 0,
		y: 0,
		z: 0
	};
	const inv = 1 / len;
	return {
		x: v.x * inv,
		y: v.y * inv,
		z: v.z * inv
	};
}
export { normalizeVec3 };

//# sourceMappingURL=normalize-vec3.js.map