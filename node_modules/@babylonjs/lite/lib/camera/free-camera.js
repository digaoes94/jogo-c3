import { writeLookAtWorldMat4LHIntoBuffer } from "../math/write-look-at-world-mat4-lh-into-buffer.js";
import { Vec3Up } from "../math/vec3-up.js";
import { allocateMat4 } from "../math/_matrix-allocator.js";
import { attachWorldMatrixState, createWorldMatrixState } from "../scene/world-matrix-state.js";
import { ObservableVec3 } from "../math/observable-vec3.js";
import { _rightHanded } from "#coordinate-system";
// src/camera/free-camera.ts
/** Create a FreeCamera at the given position looking at target. Pure data, no scene knowledge. */
function createFreeCamera(position, target) {
	return _createFreeCamera(position, target, Vec3Up);
}
/** @internal Shared FreeCamera factory. `up` is read fresh every time the local matrix is rebuilt, so
*  it accepts either the shared immutable `Vec3Up` constant (plain {@link createFreeCamera}) or a
*  mutable vector owned by a caller (`createBankedFreeCamera`, whose `ObservableVec3` up vector rolls
*  the camera when written). This module has no notion of "banked" — it just reads `up.x/y/z` — so the
*  banked opt-in adds zero branches and zero extra allocations here. */
function _createFreeCamera(position, target, up) {
	const dx = target.x - position.x;
	const dy = target.y - position.y;
	const dz = target.z - position.z;
	const _localMat = allocateMat4();
	function cameraLocalWorldMatrix() {
		writeLookAtWorldMat4LHIntoBuffer(_localMat, cam.position, cam.target, up);
		if (_rightHanded !== null) {
			const s = _localMat;
			for (const i of [
				0,
				1,
				2,
				8,
				9,
				10
			]) s[i] = -s[i];
		}
		return _localMat;
	}
	const wm = createWorldMatrixState(cameraLocalWorldMatrix);
	const onDirty = () => wm.markLocalDirty();
	let _yaw = Math.atan2(dx, dz);
	let _pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
	const cam = {
		position: new ObservableVec3(position.x, position.y, position.z, onDirty),
		target: new ObservableVec3(target.x, target.y, target.z, onDirty),
		fov: .8,
		nearPlane: 1,
		farPlane: 1e4,
		speed: 2,
		angularSensitivity: 2e3,
		inertia: .9,
		children: [],
		_viewCache: allocateMat4(),
		_projCache: allocateMat4(),
		_vpCache: allocateMat4(),
		get parent() {
			return wm.parent;
		},
		set parent(v) {
			wm.parent = v;
		},
		get worldMatrix() {
			return wm.getWorldMatrix();
		},
		get worldMatrixVersion() {
			return wm.getWorldMatrixVersion();
		}
	};
	Object.defineProperty(cam, "_yaw", {
		get() {
			return _yaw;
		},
		set(v) {
			if (_yaw !== v) {
				_yaw = v;
				onDirty();
			}
		},
		configurable: true,
		enumerable: true
	});
	Object.defineProperty(cam, "_pitch", {
		get() {
			return _pitch;
		},
		set(v) {
			if (_pitch !== v) {
				_pitch = v;
				onDirty();
			}
		},
		configurable: true,
		enumerable: true
	});
	attachWorldMatrixState(cam, wm);
	return cam;
}
export { _createFreeCamera, createFreeCamera };

//# sourceMappingURL=free-camera.js.map