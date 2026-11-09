import { createNodeLightingFeature } from "../node-lighting.js";
// src/material/node/blocks/light-information.ts
var emitter = {
	className: "LightInformationBlock",
	emit(block, outputName, _stage, state, _ctx) {
		state.usesLightsUbo = true;
		state._meshFeature = createNodeLightingFeature;
		const idxRaw = block.serialized.lightId;
		const base = `nmeLights.lights[nli(${typeof idxRaw === "number" ? idxRaw : 0}u)]`;
		const out = {
			direction: {
				expr: `${base}.vLightData.xyz`,
				type: "vec3f"
			},
			color: {
				expr: `${base}.vLightDiffuse.rgb`,
				type: "vec3f"
			},
			intensity: {
				expr: `${base}.vLightDiffuse.a`,
				type: "f32"
			}
		};
		return out[outputName] ?? out.direction;
	}
};
export { emitter };

//# sourceMappingURL=light-information.js.map