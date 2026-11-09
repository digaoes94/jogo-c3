// src/particle/node/npe-noise.ts
/** Build an NPE set with the optional UpdateNoiseBlock evaluator enabled. */
async function buildNodeParticleSetWithNoiseTextures(engine, scene, graph, options = {}) {
	return (await import("./npe-noise-runtime.js")).buildNodeParticleSetWithNoiseTexturesRuntime(engine, scene, graph, options);
}
export { buildNodeParticleSetWithNoiseTextures };

//# sourceMappingURL=npe-noise.js.map