// src/math/polar.ts
/** Writes the polar representation of `vector` into `result`. */
function polarFromVec2ToRef(vector, result) {
	result.radius = Math.hypot(vector.x, vector.y);
	result.theta = Math.atan2(vector.y, vector.x);
	return result;
}
/** Writes the rectangular representation of `polar` into `result`. */
function polarToVec2ToRef(polar, result) {
	result.x = polar.radius * Math.cos(polar.theta);
	result.y = polar.radius * Math.sin(polar.theta);
	return result;
}
/** Adds two polar-coordinate values component-wise. */
function addPolarToRef(left, right, result) {
	result.radius = left.radius + right.radius;
	result.theta = left.theta + right.theta;
	return result;
}
/** Subtracts two polar-coordinate values component-wise. */
function subtractPolarToRef(left, right, result) {
	result.radius = left.radius - right.radius;
	result.theta = left.theta - right.theta;
	return result;
}
/** Multiplies two polar-coordinate values component-wise. */
function multiplyPolarToRef(left, right, result) {
	result.radius = left.radius * right.radius;
	result.theta = left.theta * right.theta;
	return result;
}
/** Divides two polar-coordinate values component-wise. */
function dividePolarToRef(left, right, result) {
	result.radius = left.radius / right.radius;
	result.theta = left.theta / right.theta;
	return result;
}
/** Scales both components of a polar-coordinate value. */
function scalePolarToRef(polar, scale, result) {
	result.radius = polar.radius * scale;
	result.theta = polar.theta * scale;
	return result;
}
export { addPolarToRef, dividePolarToRef, multiplyPolarToRef, polarFromVec2ToRef, polarToVec2ToRef, scalePolarToRef, subtractPolarToRef };

//# sourceMappingURL=polar.js.map