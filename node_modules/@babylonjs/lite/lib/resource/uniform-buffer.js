import { createEmptyUniformBuffer } from "./empty-uniform-buffer.js";
// src/resource/uniform-buffer.ts
/** Create a raw UNIFORM + COPY_DST buffer and write initial data. Size is aligned to 16 bytes. */
function createUniformBuffer(engine, data, label) {
	const device = engine._device;
	const buffer = createEmptyUniformBuffer(engine, data.byteLength, label);
	try {
		device.queue.writeBuffer(buffer, 0, data.buffer, data.byteOffset, data.byteLength);
	} catch (error) {
		buffer.destroy();
		throw error;
	}
	return buffer;
}
export { createUniformBuffer };

//# sourceMappingURL=uniform-buffer.js.map