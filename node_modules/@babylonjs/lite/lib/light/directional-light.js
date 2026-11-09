import { ObservableVec3 } from "../math/observable-vec3.js";
import { applyLightBase, createLightBase, writeWorldLightDirection } from "./light-base.js";
// src/light/directional-light.ts
/**
* Creates a directional light shining along `direction` (a parallel light source, like the sun).
* @param direction - World-space direction the light travels along.
* @param intensity - Scalar multiplier applied to the light's diffuse and specular contribution.
* @returns Plain `DirectionalLight` data to be added to a scene via `addToScene`.
*/
function createDirectionalLight(direction, intensity = 1) {
	const { node, lvs } = createLightBase([
		0,
		0,
		0
	]);
	const light = applyLightBase(node, {
		lightType: "directional",
		direction: new ObservableVec3(direction[0], direction[1], direction[2], lvs.b),
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
		_cloneNode: (copyBase) => {
			const clone = createDirectionalLight([
				light.direction.x,
				light.direction.y,
				light.direction.z
			], light.intensity);
			clone.diffuse = [...light.diffuse];
			clone.specular = [...light.specular];
			copyBase(light, clone);
			return clone;
		},
		_writeLightUbo: (data, offset) => {
			const o = offset;
			const w = light.worldMatrix;
			writeWorldLightDirection(data, o, w, light.direction);
			data[o + 3] = 1;
			data[o + 4] = light.diffuse[0] * light.intensity;
			data[o + 5] = light.diffuse[1] * light.intensity;
			data[o + 6] = light.diffuse[2] * light.intensity;
			data[o + 7] = Number.MAX_VALUE;
			data[o + 8] = light.specular[0] * light.intensity;
			data[o + 9] = light.specular[1] * light.intensity;
			data[o + 10] = light.specular[2] * light.intensity;
		}
	}, lvs);
	return light;
}
export { createDirectionalLight };

//# sourceMappingURL=directional-light.js.map