// src/math/vec3-ref.ts
/** Copy `src` into `dst` (in place). */
function copyVec3(dst, src) {
	dst.x = src.x;
	dst.y = src.y;
	dst.z = src.z;
	return dst;
}
/** Add two vectors into `out`. */
function addVec3ToRef(a, b, out) {
	out.x = a.x + b.x;
	out.y = a.y + b.y;
	out.z = a.z + b.z;
	return out;
}
/** Add `b` into `target`. */
function addVec3InPlace(target, b) {
	return addVec3ToRef(target, b, target);
}
/** Subtract vector `b` from vector `a` into `out`. */
function subtractVec3ToRef(a, b, out) {
	out.x = a.x - b.x;
	out.y = a.y - b.y;
	out.z = a.z - b.z;
	return out;
}
/** Subtract `b` from `target`. */
function subtractVec3InPlace(target, b) {
	return subtractVec3ToRef(target, b, target);
}
/** Multiply every component of `v` by scalar `s` into `out`. */
function scaleVec3ToRef(v, s, out) {
	out.x = v.x * s;
	out.y = v.y * s;
	out.z = v.z * s;
	return out;
}
/** Multiply every component of `target` by scalar `s`. */
function scaleVec3InPlace(target, s) {
	return scaleVec3ToRef(target, s, target);
}
/** Compute the right-handed cross product `a x b` into `out`. */
function crossVec3ToRef(a, b, out) {
	const x = a.y * b.z - a.z * b.y;
	const y = a.z * b.x - a.x * b.z;
	const z = a.x * b.y - a.y * b.x;
	out.x = x;
	out.y = y;
	out.z = z;
	return out;
}
/** Replace `target` with `target x b`. */
function crossVec3InPlace(target, b) {
	return crossVec3ToRef(target, b, target);
}
/** Normalize `v` into `out`, writing zero for degenerate input. */
function normalizeVec3ToRef(v, out, epsilon = 1e-10) {
	const len = Math.hypot(v.x, v.y, v.z);
	if (len <= epsilon) {
		out.x = 0;
		out.y = 0;
		out.z = 0;
		return out;
	}
	const inv = 1 / len;
	out.x = v.x * inv;
	out.y = v.y * inv;
	out.z = v.z * inv;
	return out;
}
/** Normalize `target` in place, writing zero for degenerate input. */
function normalizeVec3InPlace(target, epsilon = 1e-10) {
	return normalizeVec3ToRef(target, target, epsilon);
}
/** Negate every vector component into `out`. */
function negateVec3ToRef(v, out) {
	out.x = -v.x;
	out.y = -v.y;
	out.z = -v.z;
	return out;
}
/** Negate `target` in place. */
function negateVec3InPlace(target) {
	return negateVec3ToRef(target, target);
}
/** Linearly interpolate from vector `a` to vector `b` by factor `t` into `out`. */
function lerpVec3ToRef(a, b, t, out) {
	out.x = a.x + (b.x - a.x) * t;
	out.y = a.y + (b.y - a.y) * t;
	out.z = a.z + (b.z - a.z) * t;
	return out;
}
/** Linearly interpolate `target` toward `b` by factor `t`. */
function lerpVec3InPlace(target, b, t) {
	return lerpVec3ToRef(target, b, t, target);
}
export { addVec3InPlace, addVec3ToRef, copyVec3, crossVec3InPlace, crossVec3ToRef, lerpVec3InPlace, lerpVec3ToRef, negateVec3InPlace, negateVec3ToRef, normalizeVec3InPlace, normalizeVec3ToRef, scaleVec3InPlace, scaleVec3ToRef, subtractVec3InPlace, subtractVec3ToRef };

//# sourceMappingURL=vec3-ref.js.map