import { loadBlockEmitter } from "./node-registry.js";
// src/material/node/node-geometry-block-loader.ts
/**
* Resolve a node-block emitter, including the geometry-renderer terminal
* (`GeometryTextureOutputBlock`). Pass as `blockLoader` to
* `parseNodeMaterialFromSnippet` for node-material geometry-renderer scenes so
* ordinary node scenes don't bundle the geometry block.
*/
async function loadNodeBlockEmitterWithGeometry(className) {
	if (className === "GeometryTextureOutputBlock") return (await import("./blocks/geometry-texture-output.js")).emitter;
	return loadBlockEmitter(className);
}
export { loadNodeBlockEmitterWithGeometry };

//# sourceMappingURL=node-geometry-block-loader.js.map