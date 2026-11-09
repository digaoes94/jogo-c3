// src/asset-container.ts
/**
* Flatten a loaded asset container's entity tree to its renderable `Mesh` nodes
* (those carrying GPU geometry), matching the flat `meshes` array Babylon.js
* loaders return. Useful for camera-framing and per-mesh inspection after a load.
*
* Tree-shakeable: only callers that import this pull it into their bundle.
*/
function getContainerMeshes(container) {
	const meshes = [];
	const seen = /* @__PURE__ */ new Set();
	const visit = (node) => {
		if (seen.has(node)) return;
		seen.add(node);
		if (node._gpu) meshes.push(node);
		const children = node.children;
		if (children) for (const child of children) visit(child);
	};
	for (const entity of container.entities) visit(entity);
	return meshes;
}
export { getContainerMeshes };

//# sourceMappingURL=asset-container.js.map