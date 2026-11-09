import { _installOrthographicProjector } from "./camera.js";
import { writeOrthoOffCenterMat4LHIntoBuffer } from "../math/write-ortho-off-center-mat4-lh-into-buffer.js";
// src/camera/orthographic.ts
var PLANE_KEYS = [
	"left",
	"right",
	"bottom",
	"top"
];
/** Invalidate everything downstream of the projection.
*
*  Per-frame consumers gate their GPU uploads on a camera change key: the forward pass's
*  scene UBO (`_writePassSceneUBO`) returns early when camera identity, that key, aspect,
*  fog, image processing and environment are all unchanged — ShaderMaterial, text, clustered
*  lighting, TAA and CSM have equivalent gates, and the `camera.ts` matrix caches key on the
*  same value. The camera transform does not move when only the view volume changes, so
*  without this bump a steady-state scene would keep rendering the previously uploaded
*  view-projection.
*
*  Bumping `_projRev` is what makes the change reach the GPU: `_cameraChangeKey` folds it
*  into that key. It is deliberately a *separate* counter from `worldMatrixVersion` — marking
*  the camera transform dirty would additionally invalidate the camera's children and, under
*  floating origin, retrigger origin rebasing across every renderable (`wrapRenderableForFO`),
*  none of which a view-volume change warrants.
*
*  Bounds are pushed here rather than polled by `_cameraChangeKey` (as `fov` / `nearPlane` /
*  `farPlane` are) because this module already owns accessors for them — pushing costs the
*  poll nothing and is exact. */
function invalidateProjection(camera) {
	camera._projRev = (camera._projRev ?? 0) + 1;
}
/** Build the live bounds object. Each field is an accessor that invalidates the camera's
*  projection state on change. Nothing in the shared `getProjectionMatrix` cache check has to
*  know about orthographic state, so perspective-only scenes are unaffected. Properties are
*  defined (not merely optional) so animation property paths like `"ortho.halfHeight"`
*  resolve. `halfHeight` is deliberately a separate `number`-only accessor: the derived
*  extents multiply through it, so accepting `null` there would silently produce a degenerate
*  (NaN) projection, whereas `null` is meaningful on the four planes. */
function createOrthographicBounds(camera, options) {
	let halfHeight = options.halfHeight ?? 1;
	const planes = {
		left: options.left ?? null,
		right: options.right ?? null,
		bottom: options.bottom ?? null,
		top: options.top ?? null
	};
	const bounds = {};
	Object.defineProperty(bounds, "halfHeight", {
		get() {
			return halfHeight;
		},
		set(v) {
			if (halfHeight !== v) {
				halfHeight = v;
				invalidateProjection(camera);
			}
		},
		enumerable: true,
		configurable: true
	});
	for (const key of PLANE_KEYS) Object.defineProperty(bounds, key, {
		get() {
			return planes[key];
		},
		set(v) {
			if (planes[key] !== v) {
				planes[key] = v;
				invalidateProjection(camera);
			}
		},
		enumerable: true,
		configurable: true
	});
	return bounds;
}
function writeOrthoProjection(camera, aspectRatio, out) {
	const b = camera.ortho;
	const halfHeight = b.halfHeight;
	const halfWidth = halfHeight * aspectRatio;
	writeOrthoOffCenterMat4LHIntoBuffer(out, b.left ?? -halfWidth, b.right ?? halfWidth, b.bottom ?? -halfHeight, b.top ?? halfHeight, camera.nearPlane, camera.farPlane);
}
/** Switch a camera to an orthographic projection, and return its live `ortho` bounds.
*
*  Depth still comes from `camera.nearPlane` / `camera.farPlane`; `camera.fov` has no
*  effect in this mode — an orthographic camera zooms by changing `halfHeight`.
*
*  The returned object is also reachable as `camera.ortho`, and stays mutable (see
*  `OrthographicBounds`), so this only needs to be called once per camera. Calling it
*  again replaces the bounds with a fresh object. */
function enableOrthographicCamera(camera, bounds) {
	_installOrthographicProjector(writeOrthoProjection);
	const ortho = createOrthographicBounds(camera, bounds ?? {});
	camera.ortho = ortho;
	invalidateProjection(camera);
	return ortho;
}
/** Switch a camera back to its perspective projection (driven by `camera.fov`). */
function disableOrthographicCamera(camera) {
	camera.ortho = null;
	const p = camera._projCache;
	p[12] = 0;
	p[13] = 0;
	p[15] = 0;
	invalidateProjection(camera);
}
export { disableOrthographicCamera, enableOrthographicCamera };

//# sourceMappingURL=orthographic.js.map