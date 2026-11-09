// src/gaussian-point-splatting/gps-state.ts
/** @internal */
function gpsRenderScale(points, budget, current = 0) {
	const exact = Math.sqrt(Math.max(0, points) / Math.max(1, budget));
	const scale = Math.max(1, Math.min(8, Math.ceil(exact)));
	return current > scale && exact > current - 1.25 ? Math.min(8, current) : scale;
}
/** @internal */
function gpsPointBudget(userAgent, touchPoints = 0) {
	return /iPad|iPhone|iPod/.test(userAgent) || /Macintosh/.test(userAgent) && touchPoints > 1 ? 9e6 : /Android|Mobile/.test(userAgent) ? 6e6 : 15e6;
}
/** @internal */
function gpsOptionsKey(gps) {
	if (!Number.isFinite(gps.pointScale) || gps.pointScale < 0) throw new RangeError("Gaussian pointScale must be finite and nonnegative");
	if (gps.renderScale !== "auto" && (!Number.isInteger(gps.renderScale) || gps.renderScale < 1 || gps.renderScale > 8)) throw new RangeError("Gaussian renderScale must be 'auto' or an integer in 1..8");
	if (!Number.isInteger(gps.maxAccumFrames) || gps.maxAccumFrames < 1 || gps.maxAccumFrames > 65535) throw new RangeError("Gaussian maxAccumFrames must be an integer in 1..65535");
	if (gps.depthVisualization !== "none" && gps.depthVisualization !== "linear" && gps.depthVisualization !== "alphaBlended") throw new RangeError("Gaussian depthVisualization must be 'none', 'linear' or 'alphaBlended'");
	return `${+gps.colorRenderMode}/${+gps.depthRenderMode}/${gps.depthVisualization}/${gps.pointScale}/${gps.renderScale}/${+gps.occlusionCulling}/${+gps.temporalReprojection}`;
}
/** @internal Returns whether the next resolve must overwrite the whole pixel cycle. */
function gpsUpdateGeneration(state, key) {
	if (state.key === key) return false;
	state.key = key;
	state.generation = state.generation + 1 & 65535;
	state.frames = 0;
	return true;
}
/** @internal History kept when streamed content changes under a still camera, so refinement blends in without a flash. */
var GPS_SOFT_RESET_SAMPLES = 8;
/** @internal History cap applied to reprojected samples, so stale view-dependent color and resampling error fade out. */
var GPS_REPROJECTION_SAMPLES = 16;
/** @internal Bounds history after a content change or reprojection without discarding the accumulated image. */
function gpsSoftReset(state, cycle, samples = 8) {
	if (state.frames > samples * cycle) state.frames = samples * cycle + state.frames % cycle;
}
/** @internal Samples kept by a reprojection; always below maxAccumFrames so a moved view resumes accumulating. */
function gpsReprojectionSamples(maxAccumFrames) {
	return Math.min(16, maxAccumFrames - 1);
}
/** @internal Completed per-pixel samples; accumulation is converged once this reaches maxAccumFrames. */
function gpsAccumulatedSamples(frames, cycle, maxAccumFrames) {
	return Math.min(maxAccumFrames, Math.floor(frames / cycle));
}
/** @internal Running-mean history cap, leaving room for the incoming sample (zero history at a one-sample limit). */
function gpsHistoryCap(frames, cycle, maxAccumFrames) {
	return Math.min(maxAccumFrames - 1, Math.floor(frames / cycle) + 1);
}
/** @internal Exact inverse-CDF Poisson at small means, normal asymptotics at large means. */
function gpsPoisson(lambda, uniform, normal = 0) {
	if (!(lambda > 0)) return 0;
	if (lambda < 12) {
		let probability = Math.exp(-lambda);
		let cumulative = probability;
		let k = 0;
		while (uniform >= cumulative && !(k > lambda && probability < 1e-7)) {
			probability *= lambda / ++k;
			cumulative += probability;
		}
		return k;
	}
	const w2 = normal * normal;
	const correction = (w2 * (w2 / 270 + 7 / 810) - 8 / 405) / lambda;
	return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * normal + (w2 - 1) / 6 - normal * (w2 + 2) / (72 * Math.sqrt(lambda)) + correction));
}
/** @internal Finest-first packed Hi-Z mip layout, including odd trailing rows and columns. */
function gpsHiZLevels(width, height) {
	if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new RangeError("Gaussian Hi-Z dimensions must be positive integers");
	const levels = [];
	let offset = 0;
	for (;;) {
		levels.push({
			offset,
			width,
			height
		});
		offset += width * height;
		if (width === 1 && height === 1) return levels;
		width = Math.max(1, width >> 1);
		height = Math.max(1, height >> 1);
	}
}
export { GPS_REPROJECTION_SAMPLES, GPS_SOFT_RESET_SAMPLES, gpsAccumulatedSamples, gpsHiZLevels, gpsHistoryCap, gpsOptionsKey, gpsPointBudget, gpsPoisson, gpsRenderScale, gpsReprojectionSamples, gpsSoftReset, gpsUpdateGeneration };

//# sourceMappingURL=gps-state.js.map