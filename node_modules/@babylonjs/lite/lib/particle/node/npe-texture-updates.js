// src/particle/node/npe-texture-updates.ts
/** Build an NPE set with both optional flow-map and noise-texture updates enabled. */
async function buildNodeParticleSetWithTextureUpdates(engine, scene, graph, options = {}) {
	return (await import("./npe-texture-updates-runtime.js")).buildNodeParticleSetWithTextureUpdatesRuntime(engine, scene, graph, options);
}
export { buildNodeParticleSetWithTextureUpdates };

//# sourceMappingURL=npe-texture-updates.js.map