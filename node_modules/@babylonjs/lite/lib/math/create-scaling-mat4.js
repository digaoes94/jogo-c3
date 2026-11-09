import { allocateMat4 } from "./_matrix-allocator.js";
// src/math/create-scaling-mat4.ts
/** Create a scaling matrix. */
function createScalingMat4(x, y, z) {
	const out = allocateMat4();
	out[0] = x;
	out[5] = y;
	out[10] = z;
	out[15] = 1;
	return out;
}
export { createScalingMat4 };

//# sourceMappingURL=create-scaling-mat4.js.map