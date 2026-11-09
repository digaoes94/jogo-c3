import { getEffectiveAspectRatio } from "./camera.js";
// src/camera/viewport.ts
var FULL_VIEWPORT = {
	x: 0,
	y: 0,
	width: 1,
	height: 1
};
function clamp01(value) {
	return Math.max(0, Math.min(1, value));
}
/** Resolve a Babylon-style normalized viewport to integer render-target pixels.
*  Babylon viewport y is normalized from the bottom; WebGPU viewport/scissor y is from the top. */
function resolveCameraViewport(camera, targetWidth, targetHeight) {
	const v = camera?.viewport ?? FULL_VIEWPORT;
	const x0 = clamp01(v.x);
	const y0 = clamp01(1 - v.y - v.height);
	const x1 = clamp01(v.x + v.width);
	const y1 = clamp01(1 - v.y);
	const x = Math.floor(x0 * targetWidth);
	const y = Math.floor(y0 * targetHeight);
	return {
		x,
		y,
		width: Math.max(0, Math.ceil(x1 * targetWidth) - x),
		height: Math.max(0, Math.ceil(y1 * targetHeight) - y)
	};
}
export { FULL_VIEWPORT, getEffectiveAspectRatio, resolveCameraViewport };

//# sourceMappingURL=viewport.js.map