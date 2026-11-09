import { buildNodeParticleSet } from "./npe-build.js";
import { addFacingBillboardSystemWithParticleBlend } from "../particle-billboard-scene.js";
// src/particle/node/npe-blend-modes.ts
/** Enable exact Babylon.js particle blend rendering on any built NPE set. */
function enableNodeParticleBlendModes(set) {
	for (const system of set.systems) system._registerBillboard = (scene, billboard) => addFacingBillboardSystemWithParticleBlend(scene, billboard, system.blendMode);
	return set;
}
/** Build an NPE set with exact Babylon.js particle blend rendering enabled. */
async function buildNodeParticleSetWithBlendModes(engine, scene, graph, options = {}) {
	return enableNodeParticleBlendModes(await buildNodeParticleSet(engine, scene, graph, options));
}
export { buildNodeParticleSetWithBlendModes, enableNodeParticleBlendModes };

//# sourceMappingURL=npe-blend-modes.js.map