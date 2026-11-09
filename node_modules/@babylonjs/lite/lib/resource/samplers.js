import { getOrCreateSampler } from "./texture-sampler-pool.js";
// src/resource/samplers.ts
var _nearestDesc = {
	magFilter: "nearest",
	minFilter: "nearest"
};
var _bilinearDesc = {
	magFilter: "linear",
	minFilter: "linear"
};
var _trilinearDesc = {
	magFilter: "linear",
	minFilter: "linear",
	mipmapFilter: "linear"
};
/** Nearest-neighbor sampler (mag/min: nearest, no mipmap). All other descriptor fields use WebGPU defaults. */
function getNearestSampler(engine) {
	return getOrCreateSampler(engine, _nearestDesc);
}
/** Bilinear sampler (mag/min: linear, no mipmap). All other descriptor fields use WebGPU defaults. */
function getBilinearSampler(engine) {
	return getOrCreateSampler(engine, _bilinearDesc);
}
/** Trilinear sampler (mag/min/mipmap: linear). All other descriptor fields use WebGPU defaults. */
function getTrilinearSampler(engine) {
	return getOrCreateSampler(engine, _trilinearDesc);
}
export { getBilinearSampler, getNearestSampler, getTrilinearSampler };

//# sourceMappingURL=samplers.js.map