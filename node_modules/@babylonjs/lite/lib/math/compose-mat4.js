import { composeMat4IntoBuffer } from "./compose-mat4-into-buffer.js";
import { allocateMat4 } from "./_matrix-allocator.js";
// src/math/compose-mat4.ts
/** Compose TRS (translation * rotation * scale) into a single Mat4. */
function composeMat4(tx, ty, tz, qx, qy, qz, qw, sx, sy, sz) {
	const out = allocateMat4();
	composeMat4IntoBuffer(out, 0, tx, ty, tz, qx, qy, qz, qw, sx, sy, sz);
	return out;
}
export { composeMat4 };

//# sourceMappingURL=compose-mat4.js.map