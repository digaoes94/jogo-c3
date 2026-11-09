import { parseNodeParticleSource } from "./npe-parser.js";
import { normalizeNodeParticleGraph } from "./npe-graph-plumbing.js";
import { buildNodeParticleSet } from "./npe-build.js";
// src/particle/node/node-particle.ts
/**
* Parse a Node Particle Editor graph (from the Babylon snippet server or inline JSON) and build its runtime
* particle systems. Inline and network snippets automatically normalize supported graph plumbing before building. The analogue of
* `parseNodeMaterialFromSnippet` for particles.
*
* @param engine - The engine (used for texture loads).
* @param scene - The hosting scene (carried in the per-particle evaluation context).
* @param snippetId - Snippet id (e.g. `#W5054F`); ignored when `options.json` is provided.
* @param options - Inline JSON, snippet server override, and emitter position.
* @returns The built {@link NodeParticleSet}.
*/
async function parseNodeParticleSetFromSnippet(engine, scene, snippetId, options = {}) {
	let source;
	if (options.json !== void 0) source = typeof options.json === "string" ? JSON.parse(options.json) : options.json;
	else source = await (await import("./npe-snippet.js")).fetchNodeParticleSnippet(snippetId, options.snippetServer);
	const graph = await normalizeNodeParticleGraph(parseNodeParticleSource(source));
	return await buildNodeParticleSet(engine, scene, graph, options);
}
export { buildNodeParticleSet, parseNodeParticleSetFromSnippet };

//# sourceMappingURL=node-particle.js.map