// src/mesh/mesh-vertex-layout.ts
/** @internal Unknown shader attributes must not inherit object prototype properties. */
function createMeshVertexLayout(attributes) {
	return Object.assign(Object.create(null), attributes);
}
export { createMeshVertexLayout };

//# sourceMappingURL=mesh-vertex-layout.js.map