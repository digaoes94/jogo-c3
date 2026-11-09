import { FgType } from "../types.js";
// src/flow-graph/gltf/object-model-mapping.ts
/** Supported `/nodes/{index}/<prop>` tails. glTF uses RH coordinates; the Lite
*  import root carries the RH→LH conversion, so accessors read/write the node's
*  LOCAL TRS with raw glTF values (no per-accessor handedness flip for
*  translation/scale). Rotation handedness is revisited in Phase 3. */
var NODE_TRS_PROPS = {
	translation: {
		prop: "translation",
		type: FgType.Vector3
	},
	rotation: {
		prop: "rotation",
		type: FgType.Quaternion
	},
	scale: {
		prop: "scale",
		type: FgType.Vector3
	}
};
export { NODE_TRS_PROPS };

//# sourceMappingURL=object-model-mapping.js.map