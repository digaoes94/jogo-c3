import { getMaterialSource } from "./material-view.js";
// src/material/material-dirty.ts
/** Mark a material source (or one of its views) as needing UBO re-upload.
*  The source owns a monotonic version so multiple renderables/views can observe
*  the same mutation independently without racing on a single cleared boolean. */
function markMaterialUboDirty(materialOrView) {
	const source = getMaterialSource(materialOrView);
	source._uboVersion++;
}
export { markMaterialUboDirty };

//# sourceMappingURL=material-dirty.js.map