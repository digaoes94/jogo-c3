import { createCsmShadowFragment } from "../../../shader/fragments/csm-shadow-fragment-core.js";
// src/material/standard/fragments/std-csm-shadow-fragment.ts
/**
* Create a per-light CSM shadow fragment for Standard materials.
* The shadow factor for each light is stored in `shadowFactors[lightIndex]`.
*/
function createStdCsmShadowFragment(shadowLights) {
	return createCsmShadowFragment("std-csm-shadow", shadowLights);
}
export { createStdCsmShadowFragment };

//# sourceMappingURL=std-csm-shadow-fragment.js.map