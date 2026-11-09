import { BU } from "../engine/gpu-flags.js";
import { align } from "./buffer-alignment.js";
// src/resource/empty-uniform-buffer.ts
/** Create an empty UNIFORM + COPY_DST buffer. `byteLength` is aligned to 16 bytes. */
function createEmptyUniformBuffer(engine, byteLength, label) {
	return engine._device.createBuffer({
		label,
		size: align(byteLength, 16),
		usage: BU.UNIFORM | BU.COPY_DST
	});
}
export { createEmptyUniformBuffer };

//# sourceMappingURL=empty-uniform-buffer.js.map