import { allocateMat4 } from "../math/_matrix-allocator.js";
import { _cameraChangeKey } from "../camera/camera.js";
import { copyXrProjectionToLeftHanded, copyXrRigidMatrixToWorld } from "./xr-coordinates.js";
// src/xr/xr-camera.ts
/** Create an XR camera for one eye. Matrices are populated each frame by
*  {@link updateXrCameraForView}; `nearPlane`/`farPlane` are advisory only
*  (the XR projection matrix already encodes the frustum). */
function createXrCamera(eye) {
	const world = allocateMat4();
	world[0] = world[5] = world[10] = world[15] = 1;
	return {
		eye,
		fov: 1,
		nearPlane: .1,
		farPlane: 1e3,
		viewport: void 0,
		children: [],
		_viewCache: allocateMat4(),
		_projCache: allocateMat4(),
		_vpCache: allocateMat4(),
		_world: world,
		_wmv: 1,
		get worldMatrix() {
			return this._world;
		},
		get worldMatrixVersion() {
			return this._wmv;
		}
	};
}
/**
* Update an XR camera from an {@link XRView} for the current frame.
*
* @param cam - The eye camera to update.
* @param view - The frame's {@link XRView} for this eye.
* @param rtWidth - Render-target width in pixels (the projection layer's texture width).
* @param rtHeight - Render-target height in pixels.
* @param viewport - Normalized viewport (`subImage.viewport / texture dims`) the
*   render task will apply. The injected-projection aspect is computed with the
*   **identical** float expression the render task uses
*   (`(rtWidth / rtHeight) * (viewport.width / viewport.height)`) so the cache
*   returns the XR projection verbatim instead of recomputing a symmetric one.
*/
function updateXrCameraForView(cam, view, rtWidth, rtHeight, viewport) {
	const m = view.transform.matrix;
	const w = cam._world;
	copyXrRigidMatrixToWorld(w, m);
	cam._wmv = cam._wmv + 1;
	cam.viewport = viewport;
	const aspect = rtWidth / rtHeight * (viewport.width / viewport.height);
	const p = cam._projCache;
	const pm = view.projectionMatrix;
	copyXrProjectionToLeftHanded(p, pm);
	p[2] = p[3] - p[2];
	p[6] = p[7] - p[6];
	p[10] = p[11] - p[10];
	p[14] = p[15] - p[14];
	cam._projVer = _cameraChangeKey(cam);
	cam._projAspect = aspect;
	cam._viewVer = -1;
	cam._vpVer = -1;
}
export { createXrCamera, updateXrCameraForView };

//# sourceMappingURL=xr-camera.js.map