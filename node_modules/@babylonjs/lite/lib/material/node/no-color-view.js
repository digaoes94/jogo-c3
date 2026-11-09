import { createMaterialView } from "../material-view.js";
import "./node-flags.js";
// src/material/node/no-color-view.ts
/** NodeMaterial material view helper with no color output. */
/** Create a no-color view over a NodeMaterial source. */
function createNodeNoColorMaterialView(source) {
	const features = source._renderFeatures ?? { features: 0 };
	return createMaterialView(source, { features: features.features | 1 });
}
export { createNodeNoColorMaterialView };

//# sourceMappingURL=no-color-view.js.map