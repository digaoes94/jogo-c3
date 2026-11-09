import { GEO_EPSILON } from "./geospatial-limits.js";
// src/camera/geospatial-movement.ts
/** Frame rate the inertia constants are tuned for (Babylon.js assumes 60 fps). */
var REFERENCE_FRAME_RATE = 60;
var REFERENCE_FRAME_MS = 1e3 / 60;
/**
* Exponential decay factor for one frame of length `effMs`, normalized so the
* effective decay over a fixed wall-clock interval is independent of frame rate:
* `inertia ^ (effMs / 16.667)`. An `inertia` of 0 fully stops each frame; higher
* values coast longer.
*/
function frameDecay(inertia, effMs, referenceFrameMs = REFERENCE_FRAME_MS) {
	return Math.pow(inertia, effMs / referenceFrameMs);
}
/**
* Advance an inertial velocity by one frame. The previous velocity decays by
* {@link frameDecay}; fresh input (`pixelDelta`, in pixels for this frame, or a
* sustained `hasActiveInput`) is injected scaled so the steady-state velocity is
* frame-rate independent. Velocities below 1e-6 with no input snap to 0.
*/
function integrateInertialVelocity(velocity, pixelDelta, inertia, effMs, hasActiveInput) {
	if (effMs === 0) return velocity;
	const decay = frameDecay(inertia, effMs);
	let v = velocity * decay;
	if (pixelDelta !== 0 || hasActiveInput) {
		const oneMinus = 1 - inertia;
		const inputScale = oneMinus > 0 ? (1 - decay) / oneMinus : 1;
		v += pixelDelta / effMs * inputScale;
	} else if (Math.abs(v) < 1e-6) v = 0;
	return v;
}
function clamp01(v) {
	return v < 0 ? 0 : v > 1 ? 1 : v;
}
/**
* Pan speed multiplier in `[0, 1]` combining two effects:
*  - latitude damping `sqrt(cos(lat))` so panning slows as the centre nears a pole,
*  - altitude scaling `max(1, centerRadius / height)` so panning is reduced when
*    the camera is far above the surface, where `height` is the eye altitude above
*    the centre's geocentric shell.
* `center` and `position` are ECEF; the result is clamped to `[0, 1]`.
*/
function computePanSpeedMultiplier(center, position) {
	const centerRadius = Math.hypot(center.x, center.y, center.z);
	const currentRadius = Math.hypot(position.x, position.y, position.z);
	const sinLat = centerRadius > 0 ? center.z / centerRadius : 0;
	const cosLat = Math.sqrt(1 - Math.min(1, sinLat * sinLat));
	const latDamp = Math.sqrt(Math.abs(cosLat));
	const height = Math.max(currentRadius - centerRadius, GEO_EPSILON);
	return clamp01(Math.max(1, centerRadius / height) * latDamp);
}
/**
* Zoom speed multiplier: `0.01 × distanceToTarget`, matching Babylon.js so the
* zoom step grows with the distance from the eye to the point being zoomed
* toward (cursor pick or look-vector hit).
*/
function computeZoomSpeedMultiplier(distanceToTarget) {
	return distanceToTarget * .01;
}
export { REFERENCE_FRAME_RATE, computePanSpeedMultiplier, computeZoomSpeedMultiplier, frameDecay, integrateInertialVelocity };

//# sourceMappingURL=geospatial-movement.js.map