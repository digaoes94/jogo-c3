// src/math/normalize-vec3-tuple-or-up.ts
/**
* Normalizes the vector `(x, y, z)` to unit length.
* @param x - X component.
* @param y - Y component.
* @param z - Z component.
* @param epsilon - Length threshold below which the vector is treated as degenerate.
* @returns The unit-length vector, or `[0, 1, 0]` if the input length is at or below `epsilon`.
*/
function normalizeVec3TupleOrUp(x, y, z, epsilon = 1e-10) {
	const len = Math.hypot(x, y, z);
	if (len <= epsilon) return [
		0,
		1,
		0
	];
	return [
		x / len,
		y / len,
		z / len
	];
}
export { normalizeVec3TupleOrUp };

//# sourceMappingURL=normalize-vec3-tuple-or-up.js.map