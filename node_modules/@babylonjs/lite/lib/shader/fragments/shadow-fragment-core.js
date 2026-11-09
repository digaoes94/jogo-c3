import { shadowAlgorithm } from "./shadow-fragment-esm.js";
import { shadowAlgorithm as shadowAlgorithm$1 } from "./shadow-fragment-pcf.js";
import { createPreparedShadowFragment } from "./shadow-fragment-builder.js";
// src/shader/fragments/shadow-fragment-core.ts
/** Create a fragment with both fallback shadow algorithms available. */
function createShadowFragment(id, shadowLights) {
	return createPreparedShadowFragment(id, shadowLights, shadowAlgorithm, shadowAlgorithm$1);
}
export { createShadowFragment };

//# sourceMappingURL=shadow-fragment-core.js.map