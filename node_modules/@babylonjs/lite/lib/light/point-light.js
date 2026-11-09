import { applyLightBase, createLightBase } from "./light-base.js";
// src/light/point-light.ts
/**
* Creates a point light that emits in all directions from `position` with distance falloff.
* @param position - World-space position of the light.
* @param intensity - Scalar multiplier applied to the light's diffuse and specular contribution.
* @returns Plain `PointLight` data to be added to a scene via `addToScene`.
*/
function createPointLight(position, intensity = 1) {
	const { node, lvs } = createLightBase(position);
	const light = applyLightBase(node, {
		lightType: "point",
		diffuse: [
			1,
			1,
			1
		],
		specular: [
			1,
			1,
			1
		],
		intensity,
		range: Number.MAX_VALUE,
		_cloneNode: (copyBase) => {
			const clone = createPointLight([
				light.position.x,
				light.position.y,
				light.position.z
			], light.intensity);
			clone.diffuse = [...light.diffuse];
			clone.specular = [...light.specular];
			clone.range = light.range;
			copyBase(light, clone);
			return clone;
		},
		_writeLightUbo: (data, offset) => {
			const o = offset;
			const w = light.worldMatrix;
			data[o] = w[12];
			data[o + 1] = w[13];
			data[o + 2] = w[14];
			data[o + 3] = 0;
			data[o + 4] = light.diffuse[0] * light.intensity;
			data[o + 5] = light.diffuse[1] * light.intensity;
			data[o + 6] = light.diffuse[2] * light.intensity;
			data[o + 7] = light.range;
			data[o + 8] = light.specular[0] * light.intensity;
			data[o + 9] = light.specular[1] * light.intensity;
			data[o + 10] = light.specular[2] * light.intensity;
		}
	}, lvs);
	return light;
}
export { createPointLight };

//# sourceMappingURL=point-light.js.map