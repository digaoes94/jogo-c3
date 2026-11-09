import { F32 } from "../../engine/typed-arrays.js";
import { BU } from "../../engine/gpu-flags.js";
import { getMaterialSource } from "../material-view.js";
import { _installShaderFinalColorResolver } from "./shader-pipeline.js";
// src/material/shader/enable-shader-material-final-color.ts
var enabledMaterials = null;
function finalColorWgsl(material, hasInstanceColor) {
	if (!enabledMaterials?.has(getMaterialSource(material))) return;
	const hasVertexColor = material.attributes.includes("color");
	if (hasVertexColor && hasInstanceColor) return `fn getFinalColor(input:VertexInput)->vec4<f32>{return input.color*input.instanceColor;}`;
	if (hasVertexColor) return `fn getFinalColor(input:VertexInput)->vec4<f32>{return input.color;}`;
	if (hasInstanceColor) return `fn getFinalColor(input:VertexInput)->vec4<f32>{return input.instanceColor;}`;
	return `fn getFinalColor(input:VertexInput)->vec4<f32>{return vec4<f32>(1.0);}`;
}
function whiteColorBuffer(engine, gpu) {
	if (gpu._shaderColorFallback) return gpu._shaderColorFallback;
	const positionBytes = gpu.positionBuffer.size;
	const vertexCount = gpu._vertexCount !== void 0 ? 1 : gpu._vbLayout?.position?._count ?? (positionBytes === 4 ? 0 : positionBytes / 12);
	const buffer = engine._device.createBuffer({
		label: "shader-final-color-white",
		size: Math.max(vertexCount * 16, 4),
		usage: BU.VERTEX,
		mappedAtCreation: true
	});
	new F32(buffer.getMappedRange()).fill(1);
	buffer.unmap();
	return gpu._shaderColorFallback = buffer;
}
/**
* Add a pipeline-specialized `getFinalColor(input)` helper to one ShaderMaterial.
* Call before `registerScene()`.
*/
function enableShaderMaterialFinalColor(material) {
	(enabledMaterials ??= /* @__PURE__ */ new WeakSet()).add(material);
	material._colorFallback = whiteColorBuffer;
	_installShaderFinalColorResolver(finalColorWgsl);
}
export { enableShaderMaterialFinalColor };

//# sourceMappingURL=enable-shader-material-final-color.js.map