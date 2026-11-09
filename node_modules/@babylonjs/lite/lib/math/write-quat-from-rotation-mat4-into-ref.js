import { _quatFromRotationBasis } from "./create-quat-from-rotation-mat4.js";
// src/math/write-quat-from-rotation-mat4-into-ref.ts
/**
* Write a unit quaternion from the rotation part of a column-major 4x4 matrix
* into caller-owned storage.
*/
function writeQuatFromRotationMat4IntoRef(matrix, out) {
	_quatFromRotationBasis(matrix[0], matrix[4], matrix[8], matrix[1], matrix[5], matrix[9], matrix[2], matrix[6], matrix[10], out);
	return out;
}
export { writeQuatFromRotationMat4IntoRef };

//# sourceMappingURL=write-quat-from-rotation-mat4-into-ref.js.map