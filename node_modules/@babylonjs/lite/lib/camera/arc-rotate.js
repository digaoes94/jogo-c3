import { writeLookAtWorldMat4LHIntoBuffer } from "../math/write-look-at-world-mat4-lh-into-buffer.js";
import { Vec3Up } from "../math/vec3-up.js";
import { allocateMat4 } from "../math/_matrix-allocator.js";
import { attachWorldMatrixState, createWorldMatrixState } from "../scene/world-matrix-state.js";
import { ObservableVec3 } from "../math/observable-vec3.js";
import { _rightHanded } from "#coordinate-system";
// src/camera/arc-rotate.ts
/** Create a bare ArcRotateCamera with given params. Pure data, no scene knowledge. */
function createArcRotateCamera(alpha, beta, radius, target) {
	function localEyePosition() {
		const cosA = Math.cos(cam.alpha), sinA = Math.sin(cam.alpha);
		const cosB = Math.cos(cam.beta);
		let sinB = Math.sin(cam.beta);
		if (sinB === 0) sinB = 1e-4;
		return {
			x: cam.target.x + cam.radius * cosA * sinB,
			y: cam.target.y + cam.radius * cosB,
			z: cam.target.z + cam.radius * sinA * sinB
		};
	}
	const _localMat = allocateMat4();
	function cameraLocalWorldMatrix() {
		writeLookAtWorldMat4LHIntoBuffer(_localMat, localEyePosition(), cam.target, Vec3Up);
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
	const scalars = {
		alpha,
		beta,
		radius
	};
	const cam = {
		alpha: 0,
		beta: 0,
		radius: 0,
		target: new ObservableVec3(target.x, target.y, target.z, onDirty),
		fov: .8,
		nearPlane: .1,
		farPlane: 1e3,
		children: [],
		inertia: .9,
		panningInertia: .9,
		angularSensibility: 1e3,
		panningSensibility: 50,
		wheelPrecision: 3,
		inertialAlphaOffset: 0,
		inertialBetaOffset: 0,
		inertialRadiusOffset: 0,
		inertialPanningX: 0,
		inertialPanningY: 0,
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
	for (const key of [
		"alpha",
		"beta",
		"radius"
	]) Object.defineProperty(cam, key, {
		get: () => scalars[key],
		set: (v) => {
			if (scalars[key] !== v) {
				scalars[key] = v;
				onDirty();
				cam._clampToLimits?.();
			}
		},
		configurable: true,
		enumerable: true
	});
	attachWorldMatrixState(cam, wm);
	return cam;
}
export { createArcRotateCamera };

//# sourceMappingURL=arc-rotate.js.map