import { cpuTextureSourceBlock } from "./blocks/cpu-texture-source-block.js";
import { updateFlowMapBlock } from "./blocks/update-flow-map-block.js";
import { updateNoiseBlock } from "./blocks/update-noise-block.js";
import { buildNodeParticleSetWithTextureUpdateRuntime } from "./npe-texture-update-runtime.js";
// src/particle/node/npe-texture-updates-runtime.ts
/** @internal Dynamically loaded implementation for combined CPU texture updates. */
function buildNodeParticleSetWithTextureUpdatesRuntime(engine, scene, graph, options) {
	return buildNodeParticleSetWithTextureUpdateRuntime(engine, scene, graph, options, "UpdateFlowMapBlock", "flowMap", updateFlowMapBlock, cpuTextureSourceBlock, "UpdateNoiseBlock", "noiseTexture", updateNoiseBlock);
}
export { buildNodeParticleSetWithTextureUpdatesRuntime };

//# sourceMappingURL=npe-texture-updates-runtime.js.map