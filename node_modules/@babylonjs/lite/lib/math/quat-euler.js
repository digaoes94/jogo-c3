// src/math/quat-euler.ts
/** Euler XYZ → quaternion (intrinsic XYZ order). */
function eulerXYZToQuatTuple(rx, ry, rz) {
	const cx = Math.cos(rx * .5), sx_ = Math.sin(rx * .5);
	const cy = Math.cos(ry * .5), sy_ = Math.sin(ry * .5);
	const cz = Math.cos(rz * .5), sz_ = Math.sin(rz * .5);
	return [
		sx_ * cy * cz + cx * sy_ * sz_,
		cx * sy_ * cz - sx_ * cy * sz_,
		cx * cy * sz_ + sx_ * sy_ * cz,
		cx * cy * cz - sx_ * sy_ * sz_
	];
}
/** Quaternion → Euler XYZ (inverse of eulerXYZToQuatTuple). */
function quatToEulerXYZTuple(qx, qy, qz, qw) {
	const sinY = 2 * (qx * qz + qw * qy);
	const ry = Math.asin(Math.max(-1, Math.min(1, sinY)));
	return [
		Math.atan2(-(2 * (qy * qz - qw * qx)), 1 - 2 * (qx * qx + qy * qy)),
		ry,
		Math.atan2(-(2 * (qx * qy - qw * qz)), 1 - 2 * (qy * qy + qz * qz))
	];
}
export { eulerXYZToQuatTuple, quatToEulerXYZTuple };

//# sourceMappingURL=quat-euler.js.map