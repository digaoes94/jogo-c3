import { getEngineLimits } from "../engine/engine-gpu-events.js";
// src/material/gaussian-splatting-part-count.ts
/** Maximum Gaussian-splat compound parts supported by the engine's uniform-buffer limit. */
function getGaussianSplattingMaxPartCount(engine) {
	const maxUniformVectors = Math.floor(getEngineLimits(engine).maxUniformBufferBindingSize / 4);
	const maxFromUniforms = Math.floor(Math.max(maxUniformVectors - 40, 0) / 5);
	return Math.min(Math.max(maxFromUniforms, 1), 256);
}
export { getGaussianSplattingMaxPartCount };

//# sourceMappingURL=gaussian-splatting-part-count.js.map