// src/math/color4-ref.ts
/** Copy `src` into `dst` (in place). */
function copyColor4(dst, src) {
	dst.r = src.r;
	dst.g = src.g;
	dst.b = src.b;
	dst.a = src.a;
	return dst;
}
/** Multiply every channel of `src` by scalar `s` into `out`. */
function scaleColor4ToRef(src, s, out) {
	out.r = src.r * s;
	out.g = src.g * s;
	out.b = src.b * s;
	out.a = src.a * s;
	return out;
}
export { copyColor4, scaleColor4ToRef };

//# sourceMappingURL=color4-ref.js.map