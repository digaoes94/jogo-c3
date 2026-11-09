// src/math/lerp-vec3.ts
/** Linearly interpolate from vector `a` to vector `b` by factor `t`. */
function lerpVec3(a, b, t) {
	return {
		x: a.x + (b.x - a.x) * t,
		y: a.y + (b.y - a.y) * t,
		z: a.z + (b.z - a.z) * t
	};
}
export { lerpVec3 };

//# sourceMappingURL=lerp-vec3.js.map