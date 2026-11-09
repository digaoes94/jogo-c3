import { ObservableVec3 } from "../math/observable-vec3.js";
import { applyLightBase, createLightBase, writeWorldLightDirection } from "./light-base.js";
// src/light/spot-light.ts
/**
* Creates a spot light: a cone of light from `position` aimed along `direction`.
* @param position - World-space position of the light.
* @param direction - World-space direction the cone points along.
* @param angle - Full cone angle in radians.
* @param exponent - Falloff exponent; higher values produce a sharper edge.
* @param intensity - Scalar multiplier applied to the light's diffuse and specular contribution.
* @returns Plain `SpotLight` data to be added to a scene via `addToScene`.
*/
function createSpotLight(position, direction, angle, exponent, intensity = 1) {
	const { node, lvs } = createLightBase(position);
	let _angle = angle;
	let _cosHalfAngle = Math.cos(angle * .5);
	const light = applyLightBase(node, {
		lightType: "spot",
		direction: new ObservableVec3(direction[0], direction[1], direction[2], lvs.b),
		angle: 0,
		exponent,
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
			const clone = createSpotLight([
				light.position.x,
				light.position.y,
				light.position.z
			], [
				light.direction.x,
				light.direction.y,
				light.direction.z
			], light.angle, light.exponent, light.intensity);
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
			data[o + 3] = 2;
			data[o + 4] = light.diffuse[0] * light.intensity;
			data[o + 5] = light.diffuse[1] * light.intensity;
			data[o + 6] = light.diffuse[2] * light.intensity;
			data[o + 7] = light.range;
			data[o + 8] = light.specular[0] * light.intensity;
			data[o + 9] = light.specular[1] * light.intensity;
			data[o + 10] = light.specular[2] * light.intensity;
			data[o + 11] = light.exponent;
			writeWorldLightDirection(data, o + 12, w, light.direction);
			data[o + 15] = _cosHalfAngle;
		}
	}, lvs);
	Object.defineProperty(light, "angle", {
		get() {
			return _angle;
		},
		set(v) {
			if (v !== _angle) {
				_angle = v;
				_cosHalfAngle = Math.cos(v * .5);
				lvs.b();
			}
		},
		configurable: true,
		enumerable: true
	});
	return light;
}
export { createSpotLight };

//# sourceMappingURL=spot-light.js.map