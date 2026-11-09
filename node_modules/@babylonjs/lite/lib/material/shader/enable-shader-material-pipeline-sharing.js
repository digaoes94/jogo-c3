import { _setSharedShaderPipelineCache } from "./shader-pipeline.js";
import { _getShaderDeviceCache, _serializeShaderVertexBuffers, _setShaderVertexBuffersKey } from "./shader-pipeline-cache.js";
// src/material/shader/enable-shader-material-pipeline-sharing.ts
var _vertexBuffersKeys = null;
/** Share layouts, shader modules and pipelines between every ShaderMaterial, including materials and
*  material views created after the first scene build. Materials whose generated WGSL, layout and pipeline
*  state are equal then compile once per device instead of once per material instance. */
function enableShaderMaterialPipelineSharing() {
	_setShaderVertexBuffersKey(vertexBuffersKey);
	_setSharedShaderPipelineCache((device, material) => {
		const current = _getShaderDeviceCache(device);
		if (material._shaderPipelineCache !== current) material._shaderPipelineCache = current;
	});
}
function vertexBuffersKey(vertexBuffers) {
	_vertexBuffersKeys ??= /* @__PURE__ */ new WeakMap();
	let key = _vertexBuffersKeys.get(vertexBuffers);
	if (key === void 0) {
		key = _serializeShaderVertexBuffers(vertexBuffers);
		_vertexBuffersKeys.set(vertexBuffers, key);
	}
	return key;
}
export { enableShaderMaterialPipelineSharing };

//# sourceMappingURL=enable-shader-material-pipeline-sharing.js.map