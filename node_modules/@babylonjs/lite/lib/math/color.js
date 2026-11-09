// src/math/color.ts
/** Convert linear [0,1] to sRGB [0,255] using the IEC 61966-2-1 transfer curve. */
function linearToSrgbByte(v) {
	const c = Math.max(0, Math.min(1, v));
	return Math.round((c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055) * 255);
}
/** Inverse of `linearToSrgbByte` — sRGB byte [0,255] → linear [0,1]. */
function srgbByteToLinear(b) {
	const c = Math.max(0, Math.min(255, b)) / 255;
	return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
}
/** Convert a packed 0xRRGGBB sRGB color to a linear-RGBA tuple suitable for
*  text-renderer `defaultColor` / `PlacedGlyph.color`. */
function packedSrgbToLinearRgba(packed, alpha = 1) {
	return [
		srgbByteToLinear(packed >> 16 & 255),
		srgbByteToLinear(packed >> 8 & 255),
		srgbByteToLinear(packed & 255),
		alpha
	];
}
export { linearToSrgbByte, packedSrgbToLinearRgba, srgbByteToLinear };

//# sourceMappingURL=color.js.map