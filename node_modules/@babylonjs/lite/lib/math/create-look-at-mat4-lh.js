import { allocateMat4Storage } from "./_matrix-allocator.js";
import { writeLookAtMat4LHIntoBuffer } from "./write-look-at-mat4-lh-into-buffer.js";
// src/math/create-look-at-mat4-lh.ts
/** Left-handed look-at matrix matching Babylon.js `Matrix.LookAtLHToRef`. */
function createLookAtMat4LH(eye, target, up) {
	const out = allocateMat4Storage();
	writeLookAtMat4LHIntoBuffer(out, eye, target, up);
	return out;
}
export { createLookAtMat4LH };

//# sourceMappingURL=create-look-at-mat4-lh.js.map