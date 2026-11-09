import { createMaterialView } from "../material-view.js";
import { NO_COLOR_OUTPUT } from "./standard-flags.js";
// src/material/standard/no-color-view.ts
/** Standard material view helper with no color output.
*
* Kept outside standard-material.ts so ordinary Standard scenes do not retain
* the helper.
*/
/** Create a no-color view over a Standard source material.
*  The view references the source; material state is never copied. */
function createStandardNoColorMaterialView(source) {
	const features = source._renderFeatures ?? { features: 0 };
	return createMaterialView(source, { features: features.features | NO_COLOR_OUTPUT });
}
export { createStandardNoColorMaterialView };

//# sourceMappingURL=no-color-view.js.map