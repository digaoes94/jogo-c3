import "../text-data.js";
// src/text/_gpu/text-style-gpu.ts
/** Owns the per-TextData style-palette storage buffer — one entry per distinct (color, scale)
*  a run draws with, indexed by the high 16 bits of an instance's packed word. Lives beside the
*  instance buffer in each renderer's per-block GPU record because, like that buffer, it mirrors
*  CPU state owned by the TextData rather than by the shared atlas. */
function createStyleBuffer(device, entries) {
	return device.createBuffer({
		label: "text-styles",
		size: entries * 32,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
	});
}
/** Grow the style buffer to fit `data`'s palette and upload it when stale. Returns true when the
*  buffer was recreated, in which case the caller must rebuild any bind group or render bundle
*  that captured the old one. A palette whose version is unchanged — the steady state for static
*  text, and for animated text too once its entry count settles — costs nothing here. */
function ensureStyleGpu(device, data, gpu) {
	const needed = Math.max(1, data._styleCount);
	let recreated = false;
	if (needed * 32 > gpu._styleBuf.size) {
		gpu._styleBuf.destroy();
		gpu._styleBuf = createStyleBuffer(device, data._styles.byteLength / 32);
		gpu._uploadedStyleVersion = -1;
		recreated = true;
	}
	if (gpu._uploadedStyleVersion !== data._styleVersion) {
		if (data._styleCount > 0) {
			const s = data._styles;
			device.queue.writeBuffer(gpu._styleBuf, 0, s.buffer, s.byteOffset, data._styleCount * 32);
		}
		gpu._uploadedStyleVersion = data._styleVersion;
	}
	return recreated;
}
export { createStyleBuffer, ensureStyleGpu };

//# sourceMappingURL=text-style-gpu.js.map