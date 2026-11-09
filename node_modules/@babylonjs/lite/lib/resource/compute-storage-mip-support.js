// src/resource/compute-storage-mip-support.ts
/** @internal Shared capability predicate for render-based compute-texture mip generation. */
function _supportsComputeRenderMipmaps(engine, viewDimension, format, sampled) {
	return sampled && viewDimension === "2d" && (format === "rgba8unorm" || format === "rgba16float" || format === "rgba8snorm" && engine._device.features.has("texture-formats-tier1"));
}
export { _supportsComputeRenderMipmaps };

//# sourceMappingURL=compute-storage-mip-support.js.map