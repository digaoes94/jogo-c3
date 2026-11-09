import { getOrCreateSampler } from "./texture-sampler-pool.js";
// src/resource/trilinear-anisotropic-sampler.ts
var _trilinearAnisotropicDesc = {
	magFilter: "linear",
	minFilter: "linear",
	mipmapFilter: "linear",
	addressModeU: "repeat",
	addressModeV: "repeat",
	addressModeW: "repeat",
	maxAnisotropy: 4
};
function getTrilinearAnisotropicSampler(engine) {
	return getOrCreateSampler(engine, _trilinearAnisotropicDesc);
}
export { getTrilinearAnisotropicSampler };

//# sourceMappingURL=trilinear-anisotropic-sampler.js.map