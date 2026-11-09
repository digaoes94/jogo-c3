import { U8 } from "../engine/typed-arrays.js";
import { BU } from "../engine/gpu-flags.js";
import { align } from "./buffer-alignment.js";
// src/resource/mapped-buffer.ts
/** Create a mapped-at-creation buffer (for VERTEX/INDEX/STORAGE uploads). Size is padded to at least 4 and aligned to 4 bytes. */
function createMappedBuffer(engine, data, usage, label) {
	const buffer = engine._device.createBuffer({
		label,
		size: align(Math.max(data.byteLength, 4), 4),
		usage: usage | BU.COPY_DST,
		mappedAtCreation: true
	});
	new U8(buffer.getMappedRange()).set(new U8(data.buffer, data.byteOffset, data.byteLength));
	buffer.unmap();
	return buffer;
}
export { createMappedBuffer };

//# sourceMappingURL=mapped-buffer.js.map