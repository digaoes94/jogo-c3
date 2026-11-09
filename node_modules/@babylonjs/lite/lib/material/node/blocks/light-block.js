import { MAX_LIGHTS } from "../../../light/types.js";
import { NME_LIGHTING_HELPER_KEY, NME_LIGHTING_HELPER_WGSL } from "./_lighting-helper.js";
import { createNodeLightingFeature } from "../node-lighting.js";
// src/material/node/blocks/light-block.ts
var SHADOW_FACTORS_ONE = `array<f32,${MAX_LIGHTS}>(${/* @__PURE__ */ new Array(MAX_LIGHTS).fill("1.0").join(", ")})`;
function resolveOptional(block, inputName, fallback, stage, state, ctx, target) {
	if (block.inputs.get(inputName)?.source) return ctx.cast(ctx.resolve(block, inputName, stage, state), target).expr;
	return fallback;
}
var emitter = {
	className: "LightBlock",
	stage: "fragment",
	emit(block, outputName, stage, state, ctx) {
		state.fragment.helpers.set(NME_LIGHTING_HELPER_KEY, NME_LIGHTING_HELPER_WGSL);
		state.usesLightsUbo = true;
		state._meshFeature = createNodeLightingFeature;
		const memoKey = `_light_${block.id}_call`;
		const callExpr = state.fragment.memo.get(memoKey);
		let callVar;
		if (!callExpr) {
			const wp = resolveOptional(block, "worldPosition", "vec3<f32>(0.0)", stage, state, ctx, "vec3f");
			const wn = resolveOptional(block, "worldNormal", "vec3<f32>(0.0, 1.0, 0.0)", stage, state, ctx, "vec3f");
			const cp = resolveOptional(block, "cameraPosition", "_NME_CAMERA_POS_", stage, state, ctx, "vec3f");
			const dc = resolveOptional(block, "diffuseColor", "vec3<f32>(1.0)", stage, state, ctx, "vec3f");
			const sc = resolveOptional(block, "specularColor", "vec3<f32>(1.0)", stage, state, ctx, "vec3f");
			const gl = resolveOptional(block, "glossiness", "1.0", stage, state, ctx, "f32");
			const gp = resolveOptional(block, "glossPower", "1024.0", stage, state, ctx, "f32");
			const sf = state.shadowLights.length > 0 ? `nme_computeShadowFactors(in)` : SHADOW_FACTORS_ONE;
			callVar = `_lt${ctx.temp(state, "light")}`;
			state.fragment.body.push(`let ${callVar} =nme_computeLighting(${wp},${wn},${cp},${dc},${sc},(${gl})*(${gp}),${sf});`);
			state.fragment.memo.set(memoKey, {
				expr: callVar,
				type: "vec4f"
			});
		} else callVar = callExpr.expr;
		return {
			diffuseOutput: {
				expr: `${callVar}.diffuse`,
				type: "vec3f"
			},
			specularOutput: {
				expr: `${callVar}.specular`,
				type: "vec3f"
			},
			shadow: {
				expr: `${callVar}.shadow`,
				type: "f32"
			}
		}[outputName] ?? {
			expr: `${callVar}.diffuse`,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=light-block.js.map