// src/xr/xr-support.ts
/** Whether the WebXR Device API is present at all (`navigator.xr`). */
function isWebXrPresent() {
	return typeof navigator !== "undefined" && "xr" in navigator && !!navigator.xr;
}
/**
* Whether the **draft** WebXR/WebGPU binding is implemented by this UA — i.e. the
* global `XRGPUBinding` constructor exists. No browser ships it yet, so this
* returns `false` everywhere today; it is the single gate the rest of the XR code
* checks before attempting a WebGPU XR session.
*/
function isWebGpuXrSupported() {
	return typeof XRGPUBinding !== "undefined";
}
/**
* Resolve whether a given immersive session mode is supported, combining the
* WebXR device check, the draft WebGPU-binding check, and the UA's
* `isSessionSupported` answer. Never throws — returns `false` on any failure.
*
* @param mode - `"immersive-vr"` or `"immersive-ar"`.
*/
async function isXrSessionSupported(mode) {
	if (!isWebXrPresent() || !isWebGpuXrSupported()) return false;
	try {
		return await navigator.xr.isSessionSupported(mode) === true;
	} catch {
		return false;
	}
}
export { isWebGpuXrSupported, isWebXrPresent, isXrSessionSupported };

//# sourceMappingURL=xr-support.js.map