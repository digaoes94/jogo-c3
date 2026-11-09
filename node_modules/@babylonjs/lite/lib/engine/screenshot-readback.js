import { BU, TU } from "./gpu-flags.js";
// src/engine/screenshot-readback.ts
/** copyTextureToBuffer requires the per-row stride to be a multiple of 256 bytes. */
function alignBytesPerRow(width) {
	return Math.ceil(width * 4 / 256) * 256;
}
/** Pre-acquire hook. Called by `renderFrame` for each surface BEFORE `_refreshScRT` acquires
*  that surface's frame swapchain texture. On the first queued capture it reconfigures the
*  surface's swapchain with COPY_SRC so the just-acquired texture is copyable. Reconfiguring
*  here (not after the scene has recorded) is mandatory: `configure()` expires the current
*  canvas texture, so doing it mid-frame would invalidate the recorded texture and fail the
*  submit. */
function preFrame(surface) {
	const queue = surface._captureQueue;
	if (!queue || queue.length === 0 || surface._swapchainCopySrc) return;
	surface._swapchainCopySrc = true;
	surface._context.configure({
		device: surface.engine._device,
		format: surface._configureFormat,
		alphaMode: surface._alphaMode,
		usage: TU.RENDER_ATTACHMENT | TU.COPY_SRC,
		viewFormats: [surface.format]
	});
}
/** The readback hook. Called once per surface per frame after the contexts have recorded (so the
*  surface's swapchain texture holds this frame) and before the encoder is finished.
*
*  By the time this runs the swapchain is already COPY_SRC-capable: `preFrame` reconfigured it
*  before the frame's texture was acquired, so the copy can be recorded straight into this
*  frame's encoder. */
function service(surface, encoder) {
	const queue = surface._captureQueue;
	if (!queue || queue.length === 0) return;
	if (!surface._swapchainCopySrc) return;
	surface._captureQueue = void 0;
	const tex = surface.scRT._colorTexture;
	if (!tex) {
		const err = /* @__PURE__ */ new Error("captureScreenshot: no swapchain texture available");
		for (const r of queue) r.reject(err);
		return;
	}
	const width = surface.scRT._width;
	const height = surface.scRT._height;
	const bytesPerRow = alignBytesPerRow(width);
	const buffer = surface.engine._device.createBuffer({
		label: "screenshot-readback",
		size: bytesPerRow * height,
		usage: BU.COPY_DST | BU.MAP_READ
	});
	encoder.copyTextureToBuffer({ texture: tex }, {
		buffer,
		bytesPerRow,
		rowsPerImage: height
	}, {
		width,
		height,
		depthOrArrayLayers: 1
	});
	finish({
		buffer,
		width,
		height,
		bytesPerRow,
		bgra: surface.format.startsWith("bgra"),
		reqs: queue
	});
}
/** Maps the staging buffer after submit, unpacks it into tightly-packed opaque RGBA8, and
*  resolves the waiting requests. Fire-and-forget: the map is async and resolves later. */
async function finish(pend) {
	const { buffer, width, height, bytesPerRow, bgra, reqs } = pend;
	try {
		await Promise.resolve();
		await buffer.mapAsync(GPUMapMode.READ);
		const src = new Uint8Array(buffer.getMappedRange());
		const out = new Uint8ClampedArray(width * height * 4);
		for (let y = 0; y < height; y++) {
			const srcRow = y * bytesPerRow;
			const dstRow = y * width * 4;
			for (let x = 0; x < width; x++) {
				const s = srcRow + x * 4;
				const d = dstRow + x * 4;
				if (bgra) {
					out[d] = src[s + 2];
					out[d + 1] = src[s + 1];
					out[d + 2] = src[s];
				} else {
					out[d] = src[s];
					out[d + 1] = src[s + 1];
					out[d + 2] = src[s + 2];
				}
				out[d + 3] = 255;
			}
		}
		buffer.unmap();
		buffer.destroy();
		const shot = {
			width,
			height,
			data: out
		};
		for (const r of reqs) r.resolve(shot);
	} catch (e) {
		try {
			buffer.destroy();
		} catch {}
		for (const r of reqs) r.reject(e);
	}
}
/** @internal Factory invoked by `captureScreenshot` after this module is dynamically imported.
*  Returns the per-frame readback hook installed on `surface._captureService`. */
function createCaptureService() {
	return service;
}
/** @internal Factory invoked by `captureScreenshot` after this module is dynamically imported.
*  Returns the pre-acquire hook installed on `engine._capturePreFrame`. */
function createCapturePreFrame() {
	return preFrame;
}
export { createCapturePreFrame, createCaptureService };

//# sourceMappingURL=screenshot-readback.js.map