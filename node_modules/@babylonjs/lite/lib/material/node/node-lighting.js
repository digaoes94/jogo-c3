import { MAX_LIGHTS } from "../../light/types.js";
import { writeMeshLightSelection } from "../../render/mesh-light-selection.js";
// src/material/node/node-lighting.ts
/** Node lighting mesh feature.
*
*  Loaded only by lighting block emitters, or by the async parser fallback for
*  custom emitters that set `usesLightsUbo`. Owns mesh light-selection layout,
*  scene-light declarations, and per-mesh index packing.
*/
/** Build the Node lighting mesh layout and writer. */
function createNodeLightingFeature() {
	const lightIndexVecs = Math.ceil(MAX_LIGHTS / 4);
	return [
		`lc:u32,li:array<vec4<u32>,${lightIndexVecs}>,`,
		`fn nli(i:u32)->u32{return meshU.li[i/4u][i%4u];}`,
		`struct LightEntry{vLightData:vec4<f32>,vLightDiffuse:vec4<f32>,vLightSpecular:vec4<f32>,vLightDirection:vec4<f32>};struct lightsUniforms{count:u32,_p0:u32,_p1:u32,_p2:u32,lights:array<LightEntry,${MAX_LIGHTS}>};@group(0)@binding(1)var<uniform>nmeLights:lightsUniforms;`,
		96 + 16 * lightIndexVecs >> 2,
		(mesh, lights, data) => {
			writeMeshLightSelection(mesh, lights, data.subarray(4));
		}
	];
}
export { createNodeLightingFeature };

//# sourceMappingURL=node-lighting.js.map