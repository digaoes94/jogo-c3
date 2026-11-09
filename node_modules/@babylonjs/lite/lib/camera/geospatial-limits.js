// src/camera/geospatial-limits.ts
/** Babylon.js `Epsilon` (used as the default minimum pitch so the camera never looks exactly straight down). */
var GEO_EPSILON = .001;
/** Create geospatial limits for a planet of the given radius, matching Babylon.js defaults. */
function createGeospatialLimits(planetRadius) {
	return {
		planetRadius,
		radiusMin: 10,
		radiusMax: planetRadius * 4,
		pitchMin: GEO_EPSILON,
		pitchMax: Math.PI / 2 - .01,
		pitchDisabledRadiusScale: {
			x: 2,
			y: 4
		},
		yawMin: -Infinity,
		yawMax: Infinity
	};
}
/**
* Computes the effective maximum pitch for a given camera radius. When
* `pitchDisabledRadiusScale` is set, pitch is interpolated from `pitchMax` down
* to `pitchMin` as the camera zooms out from `x·planetRadius` to `y·planetRadius`
* (so a fully zoomed-out camera looks straight down).
*/
function getEffectivePitchMax(limits, currentRadius) {
	const scale = limits.pitchDisabledRadiusScale;
	if (!scale) return limits.pitchMax;
	const fullPitchRadius = scale.x * limits.planetRadius;
	const noPitchRadius = scale.y * limits.planetRadius;
	if (currentRadius <= fullPitchRadius) return limits.pitchMax;
	if (currentRadius >= noPitchRadius) return limits.pitchMin;
	const t = (currentRadius - fullPitchRadius) / (noPitchRadius - fullPitchRadius);
	const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
	return limits.pitchMax * (1 - clampedT) + limits.pitchMin * clampedT;
}
/**
* Clamps a requested zoom distance so it respects the radius limits.
* @param limits - The geospatial limits.
* @param zoomDistance - Requested zoom (positive = zoom in, negative = zoom out).
* @param currentRadius - Current camera radius.
* @param distanceToTarget - Optional distance to the zoom target point (used for zoom-in clamping).
* @returns The clamped zoom distance.
*/
function clampZoomDistance(limits, zoomDistance, currentRadius, distanceToTarget) {
	if (zoomDistance > 0) {
		const maxZoomIn = (distanceToTarget ?? currentRadius) - limits.radiusMin;
		return Math.min(zoomDistance, Math.max(0, maxZoomIn));
	}
	const maxZoomOut = limits.radiusMax - currentRadius;
	return Math.max(zoomDistance, -Math.max(0, maxZoomOut));
}
export { GEO_EPSILON, clampZoomDistance, createGeospatialLimits, getEffectivePitchMax };

//# sourceMappingURL=geospatial-limits.js.map