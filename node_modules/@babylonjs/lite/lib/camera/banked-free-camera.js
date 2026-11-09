import { _markLocalMatrixDirty } from "../scene/world-matrix-state.js";
import { ObservableVec3 } from "../math/observable-vec3.js";
import { _createFreeCamera } from "./free-camera.js";
// src/camera/banked-free-camera.ts
/**
* Creates a free camera whose look-at up vector is explicit and mutable, so the camera can roll.
*
* The camera is otherwise identical to {@link createFreeCamera}: plain data, positioned in world space,
* looking at `target`, left-handed. Setting `upVector` (e.g. easing it toward a vehicle's up axis) rolls
* the view; a degenerate up (parallel to the view direction) falls back to an identity rotation, matching
* `createFreeCamera`.
*
* @param position - World-space camera position.
* @param target - World-space point the camera looks at.
* @param up - Initial world-space up vector. Defaults to world +Y.
* @returns Plain `BankedFreeCamera` data — the caller assigns it to `scene.camera`.
*/
function createBankedFreeCamera(position, target, up = {
	x: 0,
	y: 1,
	z: 0
}) {
	const upVector = new ObservableVec3(up.x, up.y, up.z, () => _markLocalMatrixDirty(cam));
	const cam = _createFreeCamera(position, target, upVector);
	Object.defineProperty(cam, "upVector", {
		value: upVector,
		enumerable: true
	});
	return cam;
}
export { createBankedFreeCamera };

//# sourceMappingURL=banked-free-camera.js.map