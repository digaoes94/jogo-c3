// src/engine/screenshot.ts
/**
* Capture the current canvas backbuffer of a {@link SurfaceContext} — the final presented
* frame (post-processing and all) with NO HTML/DOM overlay, since those are never drawn
* into the canvas.
*
* Pass `engine` to capture the engine's primary surface (the canvas given to `createEngine`),
* or pass an auxiliary surface returned by `createSurface` to capture that canvas. Each
* surface owns its own capture queue and COPY_SRC swapchain state, so surfaces that never
* capture stay compression-friendly even when another surface on the same engine is being
* captured every frame.
*
* The read is scheduled on a rendered frame: the copy is recorded into that frame's command
* encoder (so it reads a valid, just-rendered swapchain texture), then the staging buffer is
* mapped after submit and the pixels are unpacked. Requires a running render loop
* (`startEngine`); the returned promise resolves once the readback completes.
*
* Multiple calls queued on the same surface before the next serviced frame share a single
* GPU copy and all resolve with the same image.
*
* The readback implementation is loaded lazily on the first call, so engines whose surfaces
* never capture a screenshot ship none of it. The surface's swapchain stays a plain,
* compression-friendly RENDER_ATTACHMENT surface until the first capture is queued, at which
* point `renderFrame` reconfigures it once with COPY_SRC (before acquiring that frame's texture).
*/
function captureScreenshot(surface) {
	const promise = new Promise((resolve, reject) => {
		(surface._captureQueue ??= []).push({
			resolve,
			reject
		});
	});
	if (!surface._captureService) import("./screenshot-readback.js").then(({ createCaptureService, createCapturePreFrame }) => {
		surface._captureService ??= createCaptureService();
		surface._capturePreFrame ??= createCapturePreFrame();
	});
	return promise;
}
export { captureScreenshot };

//# sourceMappingURL=screenshot.js.map