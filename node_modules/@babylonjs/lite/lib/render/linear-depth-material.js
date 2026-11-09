import { createShaderMaterial } from "../material/shader/shader-material.js";
import { _rightHanded } from "#coordinate-system";
// src/render/linear-depth-material.ts
var VERTEX = _rightHanded ? `struct VertexOutput{@builtin(position)position:vec4<f32>,@location(0)viewZ:f32,};@vertex fn mainVertex(input:VertexInput)->VertexOutput{var out:VertexOutput;let worldPos=shaderSystem.world*vec4<f32>(input.position,1.0);let viewPos=shaderSystem.view*worldPos;out.position=shaderSystem.projection*viewPos;out.viewZ=-viewPos.z;return out;}` : `struct VertexOutput{@builtin(position)position:vec4<f32>,@location(0)viewZ:f32,};@vertex fn mainVertex(input:VertexInput)->VertexOutput{var out:VertexOutput;let worldPos=shaderSystem.world*vec4<f32>(input.position,1.0);let viewPos=shaderSystem.view*worldPos;out.position=shaderSystem.projection*viewPos;out.viewZ=viewPos.z;return out;}`;
var FRAGMENT = `struct VertexOutput{@builtin(position)position:vec4<f32>,@location(0)viewZ:f32,};@fragment fn mainFragment(input:VertexOutput)->@location(0)vec4<f32>{let near=shaderUniforms.nearFar.x;let far=shaderUniforms.nearFar.y;let d=clamp((input.viewZ-near)/(far-near),0.0,1.0);return vec4<f32>(d,d,d,1.0);}`;
/** Create a linear-depth ShaderMaterial that writes `(d, d, d, 1)` per fragment.
*  The depth is computed from the view-space z, normalized by the supplied
*  near/far range (or 0.03/15 by default).  Override per material via the
*  `nearFar` custom uniform. */
function createLinearDepthMaterial(options = {}) {
	const near = options.near ?? .03;
	const far = options.far ?? 15;
	return createShaderMaterial({
		name: options.name ?? "linearDepth",
		vertexSource: VERTEX,
		fragmentSource: FRAGMENT,
		attributes: ["position"],
		uniforms: [
			"world",
			"view",
			"projection",
			{
				name: "nearFar",
				type: "vec2<f32>",
				defaultValue: [near, far]
			}
		],
		backFaceCulling: true,
		depthWrite: true,
		depthCompare: "greater-equal"
	});
}
export { createLinearDepthMaterial };

//# sourceMappingURL=linear-depth-material.js.map