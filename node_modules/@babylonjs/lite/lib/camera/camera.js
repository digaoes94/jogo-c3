import { multiplyMat4IntoBuffer } from "../math/multiply-mat4-into-buffer.js";
import { writePerspectiveMat4LHIntoBuffer } from "../math/write-perspective-mat4-lh-into-buffer.js";
import { _rightHanded } from "#coordinate-system";
// src/camera/camera.ts
/** Compute the view matrix for a camera. Cached per worldMatrixVersion.
*
*  Floating-origin awareness: when `camera._useFloatingOrigin` is set
*  (LWR — wired by the scene's `_update` when the active scene camera is
*  bound to an LWR engine), the view matrix translation column is forced
*  to zero. The GPU vertex shader then sees the camera at the origin in
*  the eye-relative frame, matching the mesh-world UBO pack which
*  subtracted the camera position from world translations. View × world
*  in the shader produces eye-relative vertex coordinates at full
*  precision regardless of how far from world-origin the scene is.
*
*  When the flag is unset (standard non-LWR rendering), this path is
*  bit-identical to a normal `R_inv * -cameraPos` view matrix. */
function getViewMatrix(camera) {
	const ver = camera.worldMatrixVersion;
	if (camera._viewVer === ver) return camera._viewCache;
	const v = camera._viewCache;
	const w = camera.worldMatrix;
	const useFO = camera._useFloatingOrigin;
	const cx = useFO ? 0 : w[12];
	const cy = useFO ? 0 : w[13];
	const cz = useFO ? 0 : w[14];
	v[0] = w[0];
	v[1] = w[4];
	v[2] = w[8];
	v[3] = 0;
	v[4] = w[1];
	v[5] = w[5];
	v[6] = w[9];
	v[7] = 0;
	v[8] = w[2];
	v[9] = w[6];
	v[10] = w[10];
	v[11] = 0;
	v[12] = -(w[0] * cx + w[1] * cy + w[2] * cz);
	v[13] = -(w[4] * cx + w[5] * cy + w[6] * cz);
	v[14] = -(w[8] * cx + w[9] * cy + w[10] * cz);
	v[15] = 1;
	if (_rightHanded !== null) {
		v[2] = -v[2];
		v[6] = -v[6];
		v[10] = -v[10];
		v[14] = -v[14];
	}
	camera._viewVer = ver;
	return v;
}
/** Orthographic projection writer, installed only by `enableOrthographicCamera`. Module-local with a
*  single exported setter: when `enableOrthographicCamera` is absent from the bundle the setter
*  tree-shakes, the bundler proves this is always null, and the orthographic branch below folds away —
*  perspective-only scenes stay byte-identical. */
var _orthoProjector = null;
/** @internal Install orthographic projection support (called by `enableOrthographicCamera`). */
function _installOrthographicProjector(write) {
	_orthoProjector = write;
}
/** @internal Change key for every projection-dependent per-frame consumer, and for the
*  projection matrix caches themselves.
*
*  Consumers gate their GPU uploads on a version number. `camera.worldMatrixVersion` alone
*  is not that number: it does not move when only the view volume changes, so a steady-state
*  scene keeps rendering a stale view-projection after a `fov`, `nearPlane`, `farPlane` or
*  orthographic-bounds write.
*
*  `fov` / `nearPlane` / `farPlane` are plain writable fields on a plain-data camera
*  (pillar 4b′) — a write cannot notify anyone — so this polls them by value and folds a
*  drift into `_projRev`. Polling here rather than installing accessors in every camera
*  factory keeps the projection contract in ONE place, costs nothing per camera type, and
*  works for a hand-rolled object satisfying `Camera` (the same reason
*  `world-matrix-state.ts` polls a foreign parent's version instead of pushing to it).
*  Orthographic bounds are pushed, not polled: that module owns setters already.
*
*  Both terms of the returned sum are monotonically non-decreasing, so the sum is too and
*  any change in either strictly increases it — it cannot alias. (Same version-summing idiom
*  as `shadow-base.ts` and `gltf-feature-lights-punctual.ts`.) This relies on the `Camera`
*  contract that `worldMatrixVersion` never decreases; every in-engine camera satisfies it
*  (the counter only ever increments, including across reparenting), and a custom `Camera`
*  implementation must too or a change can be missed.
*
*  Deliberately NOT folded into `worldMatrixVersion` itself: a projection change must not be
*  mistaken for camera motion, which would invalidate the camera's children and, under
*  floating origin, retrigger origin rebasing across every renderable (`wrapRenderableForFO`).
*  Those consumers keep reading `worldMatrixVersion`. */
function _cameraChangeKey(camera) {
	if (camera._projFov !== camera.fov || camera._projNear !== camera.nearPlane || camera._projFar !== camera.farPlane) {
		camera._projFov = camera.fov;
		camera._projNear = camera.nearPlane;
		camera._projFar = camera.farPlane;
		camera._projRev = (camera._projRev ?? 0) + 1;
	}
	return camera.worldMatrixVersion + (camera._projRev ?? 0);
}
/** Compute the projection matrix for a camera. Cached per `_cameraChangeKey` + aspect. */
function getProjectionMatrix(camera, aspectRatio) {
	const ver = _cameraChangeKey(camera);
	if (camera._projVer === ver && camera._projAspect === aspectRatio) return camera._projCache;
	const p = camera._projCache;
	if (_orthoProjector !== null && camera.ortho) _orthoProjector(camera, aspectRatio, p);
	else writePerspectiveMat4LHIntoBuffer(p, camera.fov, aspectRatio, camera.nearPlane, camera.farPlane);
	camera._projVer = ver;
	camera._projAspect = aspectRatio;
	return p;
}
/** Compute the view-projection matrix for a camera. Cached per `_cameraChangeKey` + aspect. */
function getViewProjectionMatrix(camera, aspectRatio) {
	const ver = _cameraChangeKey(camera);
	if (camera._vpVer === ver && camera._vpAspect === aspectRatio) return camera._vpCache;
	const vp = camera._vpCache;
	multiplyMat4IntoBuffer(vp, 0, getProjectionMatrix(camera, aspectRatio), 0, getViewMatrix(camera), 0);
	camera._vpVer = ver;
	camera._vpAspect = aspectRatio;
	return vp;
}
/** Get the world-space position of a camera. */
function getCameraPosition(camera) {
	const w = camera.worldMatrix;
	return {
		x: w[12],
		y: w[13],
		z: w[14]
	};
}
/** Returns the render-target aspect ratio adjusted for the camera's normalized viewport, or the raw ratio if none. */
function getEffectiveAspectRatio(camera, targetWidth, targetHeight) {
	const v = camera?.viewport;
	return targetWidth / targetHeight * (v ? v.width / v.height : 1);
}
/** @internal Apply a normalized camera viewport to a WebGPU render pass. */
function _applyCameraViewport(pass, camera, targetWidth, targetHeight) {
	const v = camera?.viewport;
	if (!v) return;
	const x = Math.floor(v.x * targetWidth);
	const y = Math.floor((1 - v.y - v.height) * targetHeight);
	const width = Math.ceil((v.x + v.width) * targetWidth) - x;
	const height = Math.ceil((1 - v.y) * targetHeight) - y;
	pass.setViewport(x, y, width, height, 0, 1);
	pass.setScissorRect(x, y, width, height);
}
export { _applyCameraViewport, _cameraChangeKey, _installOrthographicProjector, getCameraPosition, getEffectiveAspectRatio, getProjectionMatrix, getViewMatrix, getViewProjectionMatrix };

//# sourceMappingURL=camera.js.map