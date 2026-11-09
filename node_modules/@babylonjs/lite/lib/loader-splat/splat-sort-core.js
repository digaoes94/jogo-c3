import { F32, U32 } from "../engine/typed-arrays.js";
// src/loader-splat/splat-sort-core.ts
/** Allocate the scratch for a cloud of `vertexCount` splats. */
function createSplatSortScratch(vertexCount) {
	const bits = Math.max(10, Math.min(20, Math.round(Math.log2(vertexCount / 4))));
	return [new F32(vertexCount), new U32(1 << bits)];
}
/** Sort-key bit width for a cloud: `clamp(round(log2(n / 4)), 10, 20)`. */
function splatSortBucketBits(vertexCount) {
	return Math.max(10, Math.min(20, Math.round(Math.log2(vertexCount / 4))));
}
/** Write the back-to-front splat order into `order[0..vertexCount)`.
*
*  `depthTransform` is the four-coefficient affine kernel `(a,b,c,d)` for
*  `cameraForward · (world · localPos − cameraPos)`. */
function sortSplatsBackToFront(positions, vertexCount, depthTransform, order, scratch) {
	const a = depthTransform[0];
	const b = depthTransform[1];
	const c = depthTransform[2];
	const d = depthTransform[3];
	const depths = scratch[0];
	let min = Infinity;
	let max = -Infinity;
	for (let j = 0; j < vertexCount; j++) {
		depths[j] = a * positions[3 * j] + b * positions[3 * j + 1] + c * positions[3 * j + 2] + d;
		const sj = depths[j];
		if (sj - sj === 0) {
			if (sj < min) min = sj;
			if (sj > max) max = sj;
		}
	}
	const range = max - min;
	if (!(range > 1e-12)) {
		for (let j = 0; j < vertexCount; j++) order[j] = j;
		return;
	}
	const counts = scratch[1];
	counts.fill(0);
	const maxKey = counts.length - 1;
	const scale = maxKey / range;
	for (let j = 0; j < vertexCount; j++) {
		const sj = depths[j];
		let key;
		if (sj - sj === 0) {
			key = (sj - min) * scale | 0;
			if (key > maxKey) key = maxKey;
		} else key = maxKey;
		depths[j] = key;
		counts[key]++;
	}
	let pos = 0;
	for (let k = maxKey; k >= 0; k--) {
		const n = counts[k];
		counts[k] = pos;
		pos += n;
	}
	for (let j = 0; j < vertexCount; j++) {
		const key = depths[j];
		order[counts[key]++] = j;
	}
}
export { createSplatSortScratch, sortSplatsBackToFront, splatSortBucketBits };

//# sourceMappingURL=splat-sort-core.js.map