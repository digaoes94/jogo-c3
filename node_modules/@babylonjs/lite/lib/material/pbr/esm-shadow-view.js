import { PBR2_ESM_SHADOW_OUTPUT } from "./pbr-flag-bits.js";
import { createMaterialView } from "../material-view.js";
// src/material/pbr/esm-shadow-view.ts
/** PBR material view helper that writes ESM shadow color. */
var PBR_ESM_SHADOW_DEPTH_CODE = `let depthMetricSM=(input.clipPos.z+shadowParams.depthValues.x)/shadowParams.depthValues.y+shadowParams.biasAndScale.x;let depthSM=clamp(exp(-min(87.0,shadowParams.biasAndScale.z*depthMetricSM)),0.0,1.0);return vec4<f32>(depthSM,1.0,1.0,1.0);`;
function createPbrEsmShadowMaterialView(source, shadowParamsUBO) {
	const features = source._renderFeatures ?? {
		features: 0,
		features2: 0
	};
	const view = createMaterialView(source, {
		features: features.features & -194,
		features2: (features.features2 ?? 0) & -17 | PBR2_ESM_SHADOW_OUTPUT
	});
	Object.defineProperty(view, "_esmShadowParamsUBO", {
		value: shadowParamsUBO,
		enumerable: false
	});
	Object.defineProperty(view, "_esmShadowDepthCode", {
		value: PBR_ESM_SHADOW_DEPTH_CODE,
		enumerable: false
	});
	return view;
}
export { createPbrEsmShadowMaterialView };

//# sourceMappingURL=esm-shadow-view.js.map