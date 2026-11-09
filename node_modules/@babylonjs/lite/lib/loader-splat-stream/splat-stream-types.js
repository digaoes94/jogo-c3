// src/loader-splat-stream/splat-stream-types.ts
function positiveSafeInteger(value, fallback, name, max = Number.MAX_SAFE_INTEGER) {
	const resolved = value ?? fallback;
	if (!Number.isSafeInteger(resolved) || resolved <= 0 || resolved > max) throw new RangeError(`[GaussianSplatStream] ${name} must be a positive safe integer${max < Number.MAX_SAFE_INTEGER ? ` no greater than ${max}` : ""}`);
	return resolved;
}
/** @internal Validates options before metadata-sized allocations are made. */
function normalizeSplatStreamOptions(options = {}) {
	const screenError = options.screenError ?? 2;
	if (!Number.isFinite(screenError) || screenError <= 0) throw new RangeError("[GaussianSplatStream] screenError must be finite and greater than zero");
	const lodHysteresis = options.lodHysteresis ?? .15;
	if (!Number.isFinite(lodHysteresis) || lodHysteresis < 0 || lodHysteresis > 1) throw new RangeError("[GaussianSplatStream] lodHysteresis must be finite and in 0..1");
	const lodCooldownMs = options.lodCooldownMs ?? 0;
	if (!Number.isFinite(lodCooldownMs) || lodCooldownMs < 0) throw new RangeError("[GaussianSplatStream] lodCooldownMs must be finite and nonnegative");
	const maxRetries = options.maxRetries ?? 2;
	if (!Number.isSafeInteger(maxRetries) || maxRetries < 0 || maxRetries > 8) throw new RangeError("[GaussianSplatStream] maxRetries must be a safe integer in 0..8");
	const maxSplats = positiveSafeInteger(options.maxSplats, 1e6, "maxSplats");
	const maxCapacitySplats = positiveSafeInteger(options.maxCapacitySplats, maxSplats, "maxCapacitySplats");
	if (maxCapacitySplats < maxSplats) throw new RangeError("[GaussianSplatStream] maxCapacitySplats must be at least maxSplats");
	return {
		maxSplats,
		maxCapacitySplats,
		maxGpuBytes: positiveSafeInteger(options.maxGpuBytes, 268435456, "maxGpuBytes"),
		maxCpuBytes: positiveSafeInteger(options.maxCpuBytes, 67108864, "maxCpuBytes"),
		maxConcurrentRequests: positiveSafeInteger(options.maxConcurrentRequests, 6, "maxConcurrentRequests", 32),
		maxConcurrentDecodes: positiveSafeInteger(options.maxConcurrentDecodes, 2, "maxConcurrentDecodes", 8),
		screenError,
		lodHysteresis,
		lodCooldownMs,
		maxRetries,
		signal: options.signal
	};
}
export { normalizeSplatStreamOptions };

//# sourceMappingURL=splat-stream-types.js.map