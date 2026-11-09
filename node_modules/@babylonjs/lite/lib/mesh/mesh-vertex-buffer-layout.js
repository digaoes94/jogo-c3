// src/mesh/mesh-vertex-buffer-layout.ts
/** @internal Apply mesh-owned packing to already-built one-layout-per-attribute pipelines. */
function applyMeshVertexBufferLayout(layouts, attributeNames, layout) {
	return layout ? layouts.map((current, index) => {
		const name = attributeNames[index];
		const meshLayout = name && current.stepMode !== "instance" ? layout[name] : void 0;
		return meshLayout ? {
			...current,
			arrayStride: meshLayout._stride,
			attributes: current.attributes.map((attribute) => ({
				...attribute,
				offset: meshLayout._offset
			}))
		} : current;
	}) : layouts;
}
export { applyMeshVertexBufferLayout };

//# sourceMappingURL=mesh-vertex-buffer-layout.js.map