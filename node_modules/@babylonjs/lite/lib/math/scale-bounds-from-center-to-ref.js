// src/math/scale-bounds-from-center-to-ref.ts
/**
* Scales axis-aligned bounds around `center`, preserving their per-axis shape.
*/
function scaleBoundsFromCenterToRef(minimum, maximum, center, factor, resultMinimum, resultMaximum) {
	const dx = maximum.x - minimum.x;
	const dy = maximum.y - minimum.y;
	const dz = maximum.z - minimum.z;
	const length = Math.hypot(dx, dy, dz);
	const halfDistance = length * factor * .5;
	const inverseLength = length === 0 ? 0 : 1 / length;
	const rx = dx * inverseLength * halfDistance;
	const ry = dy * inverseLength * halfDistance;
	const rz = dz * inverseLength * halfDistance;
	resultMinimum.x = center.x - rx;
	resultMinimum.y = center.y - ry;
	resultMinimum.z = center.z - rz;
	resultMaximum.x = center.x + rx;
	resultMaximum.y = center.y + ry;
	resultMaximum.z = center.z + rz;
}
export { scaleBoundsFromCenterToRef };

//# sourceMappingURL=scale-bounds-from-center-to-ref.js.map