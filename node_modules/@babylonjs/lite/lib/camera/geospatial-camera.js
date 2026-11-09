import { writeLookAtWorldMat4LHIntoBuffer } from "../math/write-look-at-world-mat4-lh-into-buffer.js";
import { allocateMat4 } from "../math/_matrix-allocator.js";
import { attachWorldMatrixState, createWorldMatrixState } from "../scene/world-matrix-state.js";
import { createGeospatialLimits, getEffectivePitchMax } from "./geospatial-limits.js";
import { _rightHanded } from "#coordinate-system";
// src/camera/geospatial-camera.ts
var TWO_PI = Math.PI * 2;
/** Babylon.js world "north" axis = +Z (`LeftHandedForward`, used by both handednesses). */
var WORLD_NORTH = {
	x: 0,
	y: 0,
	z: 1
};
var WORLD_RIGHT = {
	x: 1,
	y: 0,
	z: 0
};
/** sin of the spherical-latitude limit (~89.96°) used to keep the centre off the poles. */
var POLE_SINE_LIMIT = .998749218;
/** Wrap an angle to [-π, π), matching Babylon.js `Scalar.NormalizeRadians`. */
function normalizeRadians(angle) {
	return angle - TWO_PI * Math.floor((angle + Math.PI) / TWO_PI);
}
function clamp(v, min, max) {
	return v < min ? min : v > max ? max : v;
}
/**
* Build the east/north/up orthonormal basis at a point on the globe. `up` is the
* geocentric normal (normalized position); `east` and `north` complete the tangent
* frame. Like Babylon.js's `ComputeLocalBasisToRefs`, a right-handed build swaps the
* cross products, which turns `east` around and keeps `north`.
* Writes into the provided result objects and returns nothing.
*/
function computeLocalBasis(worldPos, refEast, refNorth, refUp) {
	const upLen = Math.hypot(worldPos.x, worldPos.y, worldPos.z) || 1;
	refUp.x = worldPos.x / upLen;
	refUp.y = worldPos.y / upLen;
	refUp.z = worldPos.z / upLen;
	cross(_rightHanded ? WORLD_NORTH : refUp, _rightHanded ? refUp : WORLD_NORTH, refEast);
	if (lengthSq(refEast) < .001) cross(_rightHanded ? WORLD_RIGHT : refUp, _rightHanded ? refUp : WORLD_RIGHT, refEast);
	normalizeInPlace(refEast);
	cross(_rightHanded ? refUp : refEast, _rightHanded ? refEast : refUp, refNorth);
	normalizeInPlace(refNorth);
}
/**
* Compute the lookAt direction from yaw/pitch at a centre point (forward formula).
* Writes the normalized direction into `result`.
*/
function computeLookAtFromYawPitch(yaw, pitch, center, result) {
	const east = {
		x: 0,
		y: 0,
		z: 0
	};
	const north = {
		x: 0,
		y: 0,
		z: 0
	};
	const up = {
		x: 0,
		y: 0,
		z: 0
	};
	computeLocalBasis(center, east, north, up);
	const sinPitch = Math.sin(pitch);
	const cosPitch = Math.cos(pitch);
	const cosYaw = Math.cos(yaw);
	const sinYaw = Math.sin(yaw);
	const hx = north.x * cosYaw + east.x * sinYaw;
	const hy = north.y * cosYaw + east.y * sinYaw;
	const hz = north.z * cosYaw + east.z * sinYaw;
	result.x = hx * sinPitch - up.x * cosPitch;
	result.y = hy * sinPitch - up.y * cosPitch;
	result.z = hz * sinPitch - up.z * cosPitch;
	return normalizeInPlace(result);
}
/**
* Inverse of {@link computeLookAtFromYawPitch}: given a lookAt direction and centre,
* recover the yaw/pitch that would produce it. Writes `[yaw, pitch]` into `result`.
* `currentYaw` is used as a fallback when looking straight down/up (yaw undefined).
*/
function computeYawPitchFromLookAt(lookAt, center, currentYaw, result) {
	const east = {
		x: 0,
		y: 0,
		z: 0
	};
	const north = {
		x: 0,
		y: 0,
		z: 0
	};
	const up = {
		x: 0,
		y: 0,
		z: 0
	};
	computeLocalBasis(center, east, north, up);
	const cosPitch = -(lookAt.x * up.x + lookAt.y * up.y + lookAt.z * up.z);
	const pitch = Math.acos(clamp(cosPitch, -1, 1));
	const lhx = lookAt.x + up.x * cosPitch;
	const lhy = lookAt.y + up.y * cosPitch;
	const lhz = lookAt.z + up.z * cosPitch;
	const sinPitch = Math.sin(pitch);
	if (Math.abs(sinPitch) < .001) {
		result.x = currentYaw;
		result.y = pitch;
		return result;
	}
	const inv = 1 / sinPitch;
	const hx = lhx * inv;
	const hy = lhy * inv;
	const hz = lhz * inv;
	const cosYaw = hx * north.x + hy * north.y + hz * north.z;
	const sinYaw = hx * east.x + hy * east.y + hz * east.z;
	result.x = Math.atan2(sinYaw, cosYaw);
	result.y = pitch;
	return result;
}
/**
* Clamp the camera centre away from the geographic poles (in place), so the
* tangent basis stays well-defined. Mirrors Babylon.js `ClampCenterFromPolesInPlace`.
*/
function clampCenterFromPoles(center) {
	const mag = Math.hypot(center.x, center.y, center.z);
	if (mag > .001) {
		const sinLat = center.z / mag;
		if (Math.abs(sinLat) > POLE_SINE_LIMIT) {
			const sinClamped = clamp(sinLat, -.998749218, POLE_SINE_LIMIT);
			const cosClamped = Math.sqrt(1 - sinClamped * sinClamped);
			const lon = Math.atan2(center.y, center.x);
			center.x = mag * Math.cos(lon) * cosClamped;
			center.y = mag * Math.sin(lon) * cosClamped;
			center.z = mag * sinClamped;
		}
	}
	return center;
}
/** Set one or more orientation fields at once (single recompute). Omitted fields keep their value. */
function setGeospatialOrientation(camera, orientation) {
	camera._setOrientation(orientation.yaw ?? camera.yaw, orientation.pitch ?? camera.pitch, orientation.radius ?? camera.radius, orientation.center ?? camera.center);
}
/** Create a {@link GeospatialCamera} for a planet of the given radius. Pure data, no scene knowledge. */
function createGeospatialCamera(options) {
	const limits = createGeospatialLimits(options.planetRadius);
	const center = {
		x: options.planetRadius,
		y: 0,
		z: 0
	};
	const position = {
		x: 0,
		y: 0,
		z: 0
	};
	const upVector = {
		x: 0,
		y: 1,
		z: 0
	};
	const lookAt = {
		x: 0,
		y: 0,
		z: 0
	};
	const scalars = {
		yaw: 0,
		pitch: 0,
		radius: 0
	};
	const _localMat = allocateMat4();
	function cameraLocalWorldMatrix() {
		const center3 = {
			x: position.x + lookAt.x,
			y: position.y + lookAt.y,
			z: position.z + lookAt.z
		};
		writeLookAtWorldMat4LHIntoBuffer(_localMat, position, center3, upVector);
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
	function applyOrientation(yaw, pitch, radius, newCenter) {
		scalars.yaw = normalizeRadians(yaw);
		scalars.pitch = normalizeRadians(pitch);
		scalars.radius = radius;
		center.x = newCenter.x;
		center.y = newCenter.y;
		center.z = newCenter.z;
		scalars.yaw = clamp(scalars.yaw, limits.yawMin, limits.yawMax);
		scalars.pitch = clamp(scalars.pitch, limits.pitchMin, getEffectivePitchMax(limits, scalars.radius));
		scalars.radius = clamp(scalars.radius, limits.radiusMin, limits.radiusMax);
		clampCenterFromPoles(center);
		const east = {
			x: 0,
			y: 0,
			z: 0
		};
		const north = {
			x: 0,
			y: 0,
			z: 0
		};
		const up = {
			x: 0,
			y: 0,
			z: 0
		};
		computeLocalBasis(center, east, north, up);
		computeLookAtFromYawPitch(scalars.yaw, scalars.pitch, center, lookAt);
		const right = {
			x: 0,
			y: 0,
			z: 0
		};
		cross(up, lookAt, right);
		if (lengthSq(right) < .001) {
			const cy = Math.cos(scalars.yaw);
			const sy = Math.sin(scalars.yaw);
			cross({
				x: north.x * cy + east.x * sy,
				y: north.y * cy + east.y * sy,
				z: north.z * cy + east.z * sy
			}, lookAt, right);
		}
		normalizeInPlace(right);
		cross(lookAt, right, upVector);
		normalizeInPlace(upVector);
		position.x = center.x - lookAt.x * scalars.radius;
		position.y = center.y - lookAt.y * scalars.radius;
		position.z = center.z - lookAt.z * scalars.radius;
		wm.markLocalDirty();
	}
	const cam = {
		fov: .8,
		nearPlane: 1,
		farPlane: options.planetRadius * 16,
		children: [],
		limits,
		position,
		upVector,
		_lookAt: lookAt,
		_setOrientation: applyOrientation,
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
		},
		get center() {
			return center;
		},
		set center(v) {
			applyOrientation(scalars.yaw, scalars.pitch, scalars.radius, v);
		},
		get yaw() {
			return scalars.yaw;
		},
		set yaw(v) {
			if (v !== scalars.yaw) applyOrientation(v, scalars.pitch, scalars.radius, center);
		},
		get pitch() {
			return scalars.pitch;
		},
		set pitch(v) {
			if (v !== scalars.pitch) applyOrientation(scalars.yaw, v, scalars.radius, center);
		},
		get radius() {
			return scalars.radius;
		},
		set radius(v) {
			if (v !== scalars.radius) applyOrientation(scalars.yaw, scalars.pitch, v, center);
		}
	};
	attachWorldMatrixState(cam, wm);
	applyOrientation(0, 0, limits.radiusMax !== Infinity ? limits.radiusMax : options.planetRadius * 4, center);
	return cam;
}
function cross(a, b, out) {
	const x = a.y * b.z - a.z * b.y;
	const y = a.z * b.x - a.x * b.z;
	const z = a.x * b.y - a.y * b.x;
	out.x = x;
	out.y = y;
	out.z = z;
}
function lengthSq(v) {
	return v.x * v.x + v.y * v.y + v.z * v.z;
}
function normalizeInPlace(v) {
	const len = Math.hypot(v.x, v.y, v.z);
	if (len > 1e-10) {
		const inv = 1 / len;
		v.x *= inv;
		v.y *= inv;
		v.z *= inv;
	}
	return v;
}
export { clampCenterFromPoles, computeLocalBasis, computeLookAtFromYawPitch, computeYawPitchFromLookAt, createGeospatialCamera, normalizeRadians, setGeospatialOrientation };

//# sourceMappingURL=geospatial-camera.js.map