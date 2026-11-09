import { allocateMat4 } from "./_matrix-allocator.js";
import { writePerspectiveMat4LHIntoBuffer } from "./write-perspective-mat4-lh-into-buffer.js";
// src/math/create-perspective-mat4-lh.ts
/** Reverse-Z perspective projection (left-handed, zero-to-one depth). */
function createPerspectiveMat4LH(fov, aspect, near, far) {
	const out = allocateMat4();
	writePerspectiveMat4LHIntoBuffer(out, fov, aspect, near, far);
	return out;
}
export { createPerspectiveMat4LH };

//# sourceMappingURL=create-perspective-mat4-lh.js.map