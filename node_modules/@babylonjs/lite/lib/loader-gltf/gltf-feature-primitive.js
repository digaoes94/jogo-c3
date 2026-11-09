import { mat4Determinant3 } from "../math/mat4-determinant3.js";
import { buildPrimitiveState } from "../material/pbr/pbr-primitive-topology.js";
// src/loader-gltf/gltf-feature-primitive.ts
/** Primitive-state feature (non-triangle topology + negative-determinant winding) — dynamically
*  imported, gated on a non-triangle primitive mode OR a negative-determinant node.
*
*  Both concerns become a ready-made `GPUPrimitiveState` partial on the mesh, which the shared PBR
*  pipeline path merges over its inline triangle-list default. Resolving them there instead would
*  cost the topology names, the branches and a winding test in every PBR scene, for cases that
*  essentially no asset uses — ~144 bytes that pushed a dozen scenes past their bundle ceilings.
*
*  The winding ALSO stays in the mesh's feature bits, because those key the composed shader variant:
*  a mirrored and an unmirrored mesh that are otherwise identical must not share one, or they would
*  share this state too.
*
*  The common triangle-list positive-winding case never loads this module. */
var MSH_REVERSE_WINDING = 2048;
var MSH_TOPOLOGY_SHIFT = 12;
var MSH_INDEX_U32 = 32768;
var feature = {
	id: "_primitive",
	async applyMesh(meshData, mesh) {
		const mode = meshData._primitive?.mode;
		const topo = mode === 0 ? 1 : mode & 1 ? mode + 3 >> 1 : void 0;
		const mirrored = mat4Determinant3(meshData._worldMatrix) > 0;
		let features = topo ? topo << MSH_TOPOLOGY_SHIFT | (topo > 2 && mesh._gpu.indexFormat === "uint32" ? MSH_INDEX_U32 : 0) : 0;
		if (mirrored) features |= MSH_REVERSE_WINDING;
		if (topo || mirrored) {
			const prim = topo ? buildPrimitiveState(topo, mesh._gpu.indexFormat === "uint32") : {};
			if (mirrored) prim.frontFace = "cw";
			mesh._primitive = prim;
		}
		if (features) mesh._primitiveFeatures = features;
	}
};
export { feature as default };

//# sourceMappingURL=gltf-feature-primitive.js.map