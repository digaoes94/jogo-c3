import { cpuTextureSourceBlock } from "./blocks/cpu-texture-source-block.js";
import { updateNoiseBlock } from "./blocks/update-noise-block.js";
import { buildNodeParticleSetWithTextureUpdateRuntime } from "./npe-texture-update-runtime.js";
// src/particle/node/npe-noise-runtime.ts
/** @internal Dynamically loaded implementation for the public noise-texture builder. */
function buildNodeParticleSetWithNoiseTexturesRuntime(engine, scene, graph, options) {
	return buildNodeParticleSetWithTextureUpdateRuntime(engine, scene, graph, options, "UpdateNoiseBlock", "noiseTexture", updateNoiseBlock, cpuTextureSourceBlock);
}
export { buildNodeParticleSetWithNoiseTexturesRuntime };

//# sourceMappingURL=npe-noise-runtime.js.map