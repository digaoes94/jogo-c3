import { ObservableVec3 } from "../math/observable-vec3.js";
import { applyLightBase, createLightBase, writeWorldLightDirection } from "./light-base.js";
// src/light/hemispheric.ts
/** Create a hemispheric light. Returns plain data — caller adds to scene.
*  Matches Babylon.js HemisphericLight behavior. */
function createHemisphericLight(direction = [
	0,
	1,
	0
], intensity = 1) {
	const { node, lvs } = createLightBase([
		0,
		0,
		0
	]);
	const light = applyLightBase(node, {
		lightType: "hemispheric",
		direction: new ObservableVec3(direction[0], direction[1], direction[2], lvs.b),
		intensity,
		diffuseColor: [
			1,
			1,
			1
		],
		specularColor: [
			1,
			1,
			1
		],
		groundColor: [
			0,
			0,
			0
		],
		_cloneNode: (copyBase) => {
			const clone = createHemisphericLight([
				light.direction.x,
				light.direction.y,
				light.direction.z
			], light.intensity);
			clone.diffuseColor = [...light.diffuseColor];
			clone.specularColor = [...light.specularColor];
			clone.groundColor = [...light.groundColor];
			copyBase(light, clone);
			return clone;
		},
		_writeLightUbo: (data, offset) => {
			const o = offset;
			const w = light.worldMatrix;
			writeWorldLightDirection(data, o, w, light.direction);
			data[o + 3] = 3;
			data[o + 4] = light.diffuseColor[0] * light.intensity;
			data[o + 5] = light.diffuseColor[1] * light.intensity;
			data[o + 6] = light.diffuseColor[2] * light.intensity;
			data[o + 8] = light.specularColor[0] * light.intensity;
			data[o + 9] = light.specularColor[1] * light.intensity;
			data[o + 10] = light.specularColor[2] * light.intensity;
			data[o + 12] = light.groundColor[0] * light.intensity;
			data[o + 13] = light.groundColor[1] * light.intensity;
			data[o + 14] = light.groundColor[2] * light.intensity;
		}
	}, lvs);
	return light;
}
export { createHemisphericLight };

//# sourceMappingURL=hemispheric.js.map