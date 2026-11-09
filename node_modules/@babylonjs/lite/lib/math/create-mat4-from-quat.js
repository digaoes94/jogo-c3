import { composeMat4IntoBuffer } from "./compose-mat4-into-buffer.js";
import { allocateMat4 } from "./_matrix-allocator.js";
// src/math/create-mat4-from-quat.ts
/** Write a rotation matrix from a quaternion into an existing matrix buffer. */
function writeMat4FromQuatIntoBuffer(out, qx, qy, qz, qw) {
	composeMat4IntoBuffer(out, 0, 0, 0, 0, qx, qy, qz, qw, 1, 1, 1);
	return out;
}
/** Create a rotation matrix from a quaternion. */
function createMat4FromQuat(qx, qy, qz, qw) {
	const out = allocateMat4();
	composeMat4IntoBuffer(out, 0, 0, 0, 0, qx, qy, qz, qw, 1, 1, 1);
	return out;
}
export { createMat4FromQuat, writeMat4FromQuatIntoBuffer };

//# sourceMappingURL=create-mat4-from-quat.js.map