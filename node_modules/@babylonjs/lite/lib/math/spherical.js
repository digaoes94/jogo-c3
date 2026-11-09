// src/math/spherical.ts
/** Writes the spherical representation of `vector` into `result`. */
function sphericalFromVec3ToRef(vector, result) {
	result.radius = Math.hypot(vector.x, vector.y, vector.z);
	result.theta = Math.acos(vector.y / result.radius);
	result.phi = Math.atan2(vector.z, vector.x);
	return result;
}
/** Writes the rectangular representation of `spherical` into `result`. */
function sphericalToVec3ToRef(spherical, result) {
	const sinTheta = Math.sin(spherical.theta);
	result.x = spherical.radius * sinTheta * Math.cos(spherical.phi);
	result.y = spherical.radius * Math.cos(spherical.theta);
	result.z = spherical.radius * sinTheta * Math.sin(spherical.phi);
	return result;
}
/** Adds two spherical-coordinate values component-wise. */
function addSphericalToRef(left, right, result) {
	result.radius = left.radius + right.radius;
	result.theta = left.theta + right.theta;
	result.phi = left.phi + right.phi;
	return result;
}
/** Subtracts two spherical-coordinate values component-wise. */
function subtractSphericalToRef(left, right, result) {
	result.radius = left.radius - right.radius;
	result.theta = left.theta - right.theta;
	result.phi = left.phi - right.phi;
	return result;
}
/** Multiplies two spherical-coordinate values component-wise. */
function multiplySphericalToRef(left, right, result) {
	result.radius = left.radius * right.radius;
	result.theta = left.theta * right.theta;
	result.phi = left.phi * right.phi;
	return result;
}
/** Divides two spherical-coordinate values component-wise. */
function divideSphericalToRef(left, right, result) {
	result.radius = left.radius / right.radius;
	result.theta = left.theta / right.theta;
	result.phi = left.phi / right.phi;
	return result;
}
/** Scales every component of a spherical-coordinate value. */
function scaleSphericalToRef(spherical, scale, result) {
	result.radius = spherical.radius * scale;
	result.theta = spherical.theta * scale;
	result.phi = spherical.phi * scale;
	return result;
}
export { addSphericalToRef, divideSphericalToRef, multiplySphericalToRef, scaleSphericalToRef, sphericalFromVec3ToRef, sphericalToVec3ToRef, subtractSphericalToRef };

//# sourceMappingURL=spherical.js.map