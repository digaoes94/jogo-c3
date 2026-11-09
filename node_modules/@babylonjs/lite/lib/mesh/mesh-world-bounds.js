// src/mesh/mesh-world-bounds.ts
/** Accumulator containing no points; `minX` stays non-finite until something is added. */
function emptyWorldAabb() {
	return {
		minX: Infinity,
		minY: Infinity,
		minZ: Infinity,
		maxX: -Infinity,
		maxY: -Infinity,
		maxZ: -Infinity
	};
}
function addRange(acc, axis, center, radius) {
	const min = center - radius;
	const max = center + radius;
	const minKey = axis === 0 ? "minX" : axis === 1 ? "minY" : "minZ";
	const maxKey = axis === 0 ? "maxX" : axis === 1 ? "maxY" : "maxZ";
	if (min < acc[minKey]) acc[minKey] = min;
	if (max > acc[maxKey]) acc[maxKey] = max;
}
/** Expand `acc` by every corner of `mesh`'s local bounds taken through `mesh.worldMatrix`, and through each
*  thin-instance matrix when the mesh carries instances. Meshes without bounds contribute nothing. */
function expandWorldAabbForMesh(acc, mesh) {
	const bmin = mesh.boundMin;
	const bmax = mesh.boundMax;
	if (!bmin || !bmax) return;
	if (mesh._expandWorldBounds !== void 0) {
		mesh._expandWorldBounds(acc, mesh);
		return;
	}
	const world = mesh.worldMatrix;
	const center = [
		(bmin[0] + bmax[0]) * .5,
		(bmin[1] + bmax[1]) * .5,
		(bmin[2] + bmax[2]) * .5
	];
	const extent = [
		(bmax[0] - bmin[0]) * .5,
		(bmax[1] - bmin[1]) * .5,
		(bmax[2] - bmin[2]) * .5
	];
	for (let row = 0; row < 3; row++) {
		let transformedCenter = world[12 + row];
		let transformedRadius = 0;
		for (let column = 0; column < 3; column++) {
			const coefficient = world[column * 4 + row];
			transformedCenter += coefficient * center[column];
			transformedRadius += Math.abs(coefficient) * extent[column];
		}
		addRange(acc, row, transformedCenter, transformedRadius);
	}
}
export { emptyWorldAabb, expandWorldAabbForMesh };

//# sourceMappingURL=mesh-world-bounds.js.map