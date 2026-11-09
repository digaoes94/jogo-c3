import { releaseTextureAllocation } from "./texture-allocation-release.js";
// src/resource/gpu-texture-release.ts
/** Decrement ownership of a raw GPUTexture without a facade notification. */
function releaseGPUTexture(texture) {
	return releaseTextureAllocation(texture);
}
export { releaseGPUTexture };

//# sourceMappingURL=gpu-texture-release.js.map