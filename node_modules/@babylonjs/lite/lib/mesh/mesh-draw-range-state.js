// src/mesh/mesh-draw-range-state.ts
/** Install the readonly count facade only when exact ranges are enabled. */
function setMeshDrawRangeSource(gpu, source) {
	const capacity = gpu.indexCount;
	gpu._drawRangeSource = source;
	Object.defineProperty(gpu, "indexCount", {
		enumerable: true,
		configurable: true,
		get: () => gpu._drawRangeSource?.indexCount ?? capacity
	});
}
export { setMeshDrawRangeSource };

//# sourceMappingURL=mesh-draw-range-state.js.map