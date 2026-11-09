// src/compute/compute-sampler-resource.ts
/** @internal Classify the descriptor before allocating a GPU sampler. */
function _inferComputeSamplerType(descriptor = {}) {
	return descriptor.compare ? "comparison" : descriptor.minFilter === "linear" || descriptor.magFilter === "linear" || descriptor.mipmapFilter === "linear" ? "filtering" : "non-filtering";
}
/** Create a compute sampler without entering the shared render sampler cache. */
function createComputeSampler(engine, descriptor = {}) {
	return {
		type: _inferComputeSamplerType(descriptor),
		_engine: engine,
		_sampler: engine._device.createSampler(descriptor)
	};
}
export { _inferComputeSamplerType, createComputeSampler };

//# sourceMappingURL=compute-sampler-resource.js.map