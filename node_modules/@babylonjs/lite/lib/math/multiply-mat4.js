import { multiplyMat4IntoBuffer } from "./multiply-mat4-into-buffer.js";
import { allocateMat4 } from "./_matrix-allocator.js";
// src/math/multiply-mat4.ts
/** Multiply two Mat4: out = a * b (column-major). */
function multiplyMat4(a, b) {
	const out = allocateMat4();
	multiplyMat4IntoBuffer(out, 0, a, 0, b, 0);
	return out;
}
export { multiplyMat4 };

//# sourceMappingURL=multiply-mat4.js.map