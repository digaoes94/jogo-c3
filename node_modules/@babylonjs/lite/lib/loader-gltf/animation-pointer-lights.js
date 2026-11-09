import { _appendPointerHandlers } from "./animation-pointer.js";
import { getGltfPunctualLight } from "./gltf-light-pointer-state.js";
// src/loader-gltf/animation-pointer-lights.ts
_appendPointerHandlers([[/^\/extensions\/KHR_lights_punctual\/lights\/(\d+)\/(color|intensity|range|spot\/outerConeAngle)$/, (m, ctx) => {
	const lightIdx = +m[1];
	const field = m[2];
	const getLight = () => {
		return getGltfPunctualLight(ctx._json, lightIdx) ?? null;
	};
	return {
		arity: field === "color" ? 3 : 1,
		writer: (out, off) => {
			const light = getLight();
			if (!light) return;
			if (field === "color") {
				if (light.diffuse) {
					light.diffuse[0] = out[off];
					light.diffuse[1] = out[off + 1];
					light.diffuse[2] = out[off + 2];
				}
				if (light.specular) {
					light.specular[0] = out[off];
					light.specular[1] = out[off + 1];
					light.specular[2] = out[off + 2];
				}
			} else if (field === "intensity") light.intensity = out[off];
			else if (field === "range") light.range = out[off];
			else if (light.lightType === "spot") light.angle = out[off] * 2;
			light._bumpLightVersion?.();
		}
	};
}]]);

//# sourceMappingURL=animation-pointer-lights.js.map