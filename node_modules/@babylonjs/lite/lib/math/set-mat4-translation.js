// src/math/set-mat4-translation.ts
/** Set the translation components of a 4x4 matrix in place. */
function setMat4Translation(matrix, x, y, z) {
	const storage = matrix;
	storage[12] = x;
	storage[13] = y;
	storage[14] = z;
	return matrix;
}
export { setMat4Translation };

//# sourceMappingURL=set-mat4-translation.js.map