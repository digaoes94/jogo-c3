// src/math/inverse-lerp.ts
/** Return the parameter of `value` between either-ordered endpoints, clamped to [0, 1]; identical endpoints return 0. */
function inverseLerp(a, b, value) {
	return a === b ? 0 : Math.min(1, Math.max(0, (value - a) / (b - a)));
}
export { inverseLerp };

//# sourceMappingURL=inverse-lerp.js.map