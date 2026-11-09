// src/math/gaussian-point-splatting-compat-helpers.ts
/** @internal Babylon.js compat bridge; not part of the public Lite API. */
function _hasGaussianPointSplattingProjectedDepth(projection) {
	return projection[2] !== 0 || projection[6] !== 0 || projection[3] !== 0 || projection[7] !== 0;
}
/** @internal Babylon.js compat bridge; not part of the public Lite API. */
function _getGaussianPointSplattingPackedShBytesPerSplat(shDegree) {
	if (shDegree < 1) return 0;
	return Math.ceil((shDegree === 1 ? 3 : shDegree === 2 ? 8 : shDegree === 3 ? 15 : 24) * 3 / 4) * 4;
}
export { _getGaussianPointSplattingPackedShBytesPerSplat, _hasGaussianPointSplattingProjectedDepth };

//# sourceMappingURL=gaussian-point-splatting-compat-helpers.js.map