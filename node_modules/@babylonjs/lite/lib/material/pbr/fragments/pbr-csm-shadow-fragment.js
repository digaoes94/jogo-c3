import { createCsmShadowFragment } from "../../../shader/fragments/csm-shadow-fragment-core.js";
// src/material/pbr/fragments/pbr-csm-shadow-fragment.ts
/**
* Create a per-light CSM shadow fragment for PBR materials.
* The shadow factor for each light is stored in `shadowFactors[lightIndex]`.
*/
function createPbrCsmShadowFragment(shadowLights) {
	return createCsmShadowFragment("pbr-csm-shadow", shadowLights, {
		worldPosExpr: "input.worldPos",
		viewZExpr: "(scene.view * vec4<f32>(input.worldPos, 1.0)).z",
		outputSlot: "AS"
	});
}
export { createPbrCsmShadowFragment };

//# sourceMappingURL=pbr-csm-shadow-fragment.js.map