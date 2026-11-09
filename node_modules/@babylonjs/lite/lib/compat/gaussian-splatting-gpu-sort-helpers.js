// src/compat/gaussian-splatting-gpu-sort-helpers.ts
var MIN_KEY_BITS = 8;
var MAX_KEY_BITS = 24;
var RADIX_BITS = 4;
var MAX_SORT_KEY_COUNT = 16777216;
var MAX_FLOAT_EXACT_SPLAT_COUNT = 1 << 24;
var DEFAULT_MAX_STORAGE_BUFFER_SIZE = 134217728;
var MIN_DEPTH_RANGE = 1e-12;
function clampGaussianSplattingGpuSortKeyBits(keyBits) {
	return Math.min(MAX_KEY_BITS, Math.max(MIN_KEY_BITS, Math.round(keyBits)));
}
function getGaussianSplattingGpuSortPassCount(keyBits) {
	return Math.ceil(clampGaussianSplattingGpuSortKeyBits(keyBits) / RADIX_BITS);
}
function getGaussianSplattingGpuSortPaddedCount(activeCount) {
	return Math.max(activeCount + 15 & -16, 16);
}
function packGaussianSplattingGpuSortIntervals(intervals, vertexCount) {
	const data = new Uint32Array(Math.max(intervals.length & -2, 2));
	let count = 0;
	let total = 0;
	for (let index = 0; index + 1 < intervals.length; index += 2) {
		const start = Math.min(Math.max(intervals[index] ?? 0, 0), vertexCount);
		const length = Math.min(Math.max(intervals[index + 1] ?? 0, 0), vertexCount - start);
		if (length > 0) {
			data[count * 2] = total;
			data[count * 2 + 1] = start;
			count++;
			total += length;
		}
	}
	return {
		data,
		count,
		total
	};
}
function computeGaussianSplattingGpuSortDepthCoefficients(world, view, depthSign, cameraPosition, out, offset, worldOffset = 0) {
	const fx = view[2] ?? 0;
	const fy = view[6] ?? 0;
	const fz = view[10] ?? 0;
	out[offset] = (fx * (world[worldOffset] ?? 0) + fy * (world[worldOffset + 1] ?? 0) + fz * (world[worldOffset + 2] ?? 0)) * depthSign;
	out[offset + 1] = (fx * (world[worldOffset + 4] ?? 0) + fy * (world[worldOffset + 5] ?? 0) + fz * (world[worldOffset + 6] ?? 0)) * depthSign;
	out[offset + 2] = (fx * (world[worldOffset + 8] ?? 0) + fy * (world[worldOffset + 9] ?? 0) + fz * (world[worldOffset + 10] ?? 0)) * depthSign;
	const translation = fx * (world[worldOffset + 12] ?? 0) + fy * (world[worldOffset + 13] ?? 0) + fz * (world[worldOffset + 14] ?? 0);
	const distance = cameraPosition ? translation - (fx * (cameraPosition[0] ?? 0) + fy * (cameraPosition[1] ?? 0) + fz * (cameraPosition[2] ?? 0)) : translation + (view[14] ?? 0);
	out[offset + 3] = distance * depthSign;
}
function computeGaussianSplattingGpuSortDepthRange(coefficients, setCount, boundsMin, boundsMax, result = {
	min: 0,
	max: 0
}) {
	let min = Infinity;
	let max = -Infinity;
	for (let set = 0; set < setCount; set++) {
		let setMin = coefficients[set * 4 + 3] ?? 0;
		let setMax = setMin;
		for (let axis = 0; axis < 3; axis++) {
			const coefficient = coefficients[set * 4 + axis] ?? 0;
			const a = coefficient * (boundsMin[axis] ?? 0);
			const b = coefficient * (boundsMax[axis] ?? 0);
			setMin += Math.min(a, b);
			setMax += Math.max(a, b);
		}
		min = Math.min(min, setMin);
		max = Math.max(max, setMax);
	}
	result.min = min;
	result.max = max;
	return result;
}
function computeGaussianSplattingGpuSortKeyScale(depthMin, depthMax, keyBits) {
	const range = depthMax - depthMin;
	return range > MIN_DEPTH_RANGE ? (2 ** clampGaussianSplattingGpuSortKeyBits(keyBits) - 1) / range : 0;
}
function decodeGaussianSplattingGpuSortSogMean(value) {
	return Math.sign(value) * (Math.exp(Math.abs(value)) - 1);
}
function getGaussianSplattingGpuSorterMaxSplatCount(maxStorageBufferBindingSize, maxBufferSize) {
	return Math.min(MAX_FLOAT_EXACT_SPLAT_COUNT, MAX_SORT_KEY_COUNT, Math.floor(Math.min(maxStorageBufferBindingSize ?? DEFAULT_MAX_STORAGE_BUFFER_SIZE, maxBufferSize ?? DEFAULT_MAX_STORAGE_BUFFER_SIZE) / Float32Array.BYTES_PER_ELEMENT) & -16);
}
export { clampGaussianSplattingGpuSortKeyBits, computeGaussianSplattingGpuSortDepthCoefficients, computeGaussianSplattingGpuSortDepthRange, computeGaussianSplattingGpuSortKeyScale, decodeGaussianSplattingGpuSortSogMean, getGaussianSplattingGpuSortPaddedCount, getGaussianSplattingGpuSortPassCount, getGaussianSplattingGpuSorterMaxSplatCount, packGaussianSplattingGpuSortIntervals };

//# sourceMappingURL=gaussian-splatting-gpu-sort-helpers.js.map