// src/particle/node/npe-flow-map.ts
/** Build an NPE set with the optional UpdateFlowMapBlock evaluator enabled. */
async function buildNodeParticleSetWithFlowMaps(engine, scene, graph, options = {}) {
	return (await import("./npe-flow-map-runtime.js")).buildNodeParticleSetWithFlowMapsRuntime(engine, scene, graph, options);
}
export { buildNodeParticleSetWithFlowMaps };

//# sourceMappingURL=npe-flow-map.js.map