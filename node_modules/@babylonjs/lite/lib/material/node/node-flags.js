// src/material/node/node-flags.ts
/** NodeMaterial render-feature bits. */
var NODE_NO_COLOR_OUTPUT = 1;
var NODE_ESM_SHADOW_OUTPUT = 2;
/** Set by {@link createNodeGeometryMaterialView}. The geometry renderable
*  re-emits the graph from the GeometryTextureOutputBlock terminal and the
*  node pipeline emits a multi-attachment `FragmentOutput` instead of a single
*  colour. Zero impact on scenes that never create a geometry view. */
var NODE_GEOMETRY_OUTPUT = 4;
export { NODE_ESM_SHADOW_OUTPUT, NODE_GEOMETRY_OUTPUT, NODE_NO_COLOR_OUTPUT };

//# sourceMappingURL=node-flags.js.map