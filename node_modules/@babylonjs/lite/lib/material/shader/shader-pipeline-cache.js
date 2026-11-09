import { targetSignatureKey } from "../../engine/render-target-signature.js";
import { _getShaderVbSupport } from "./shader-vb-support.js";
// src/material/shader/shader-pipeline-cache.ts
var _deviceCaches = null;
var _generation = 0;
var _vertexBuffersKey = null;
/** @internal Install the optional vertex-layout key resolver. */
function _setShaderVertexBuffersKey(resolve) {
	_vertexBuffersKey = resolve;
}
/** @internal Enable cross-material ShaderMaterial caches for one multi-material build group. */
function enableShaderPipelineCache(engine, meshes) {
	const cache = _getShaderDeviceCache(engine._device);
	for (const mesh of meshes) mesh.material._shaderPipelineCache = cache;
}
/** Clear all shared ShaderMaterial layouts, modules, and pipelines. */
function clearShaderPipelineCache() {
	_deviceCaches = null;
	_generation++;
}
/** @internal Move an installed cross-material cache to the current GPU device before async preparation. */
function retargetShaderPipelineCache(material, device) {
	if (material._shaderPipelineCache) material._shaderPipelineCache = _getShaderDeviceCache(device);
}
/** @internal Resolve the shared cache for the current real GPU device. */
function _getShaderDeviceCache(device) {
	_deviceCaches ??= /* @__PURE__ */ new WeakMap();
	let cache = _deviceCaches.get(device);
	if (cache) return cache;
	const bindings = /* @__PURE__ */ new Map();
	const modules = /* @__PURE__ */ new Map();
	cache = {
		bindings,
		modules,
		localGeneration: _generation,
		nextModuleId: 1,
		get generation() {
			return _generation;
		},
		getBindings(material) {
			refresh(cache);
			return bindings.get(bindingsKey(material));
		},
		setBindings(material, value) {
			refresh(cache);
			bindings.set(bindingsKey(material), value);
		},
		getModule(gpu, code, label) {
			refresh(cache);
			let entry = modules.get(code);
			if (!entry) {
				entry = {
					id: cache.nextModuleId++,
					module: gpu.createShaderModule({
						label,
						code
					})
				};
				modules.set(code, entry);
			}
			return entry;
		},
		_getModules(gpu, material, currentBindings, key, label, createCodes) {
			let memo = material._shaderModuleMemo;
			if (!memo || memo[0] !== material || memo[1] !== currentBindings) material._shaderModuleMemo = memo = [
				material,
				currentBindings,
				/* @__PURE__ */ new Map()
			];
			let resolved = memo[2].get(key);
			if (!resolved) {
				const [vertexCode, fragmentCode] = createCodes();
				resolved = [cache.getModule(gpu, vertexCode, `${label}-vertex`), fragmentCode === null ? null : cache.getModule(gpu, fragmentCode, `${label}-fragment`)];
				memo[2].set(key, resolved);
			}
			return resolved;
		},
		getPipelineKey(sig, variantKey, vertexModuleId, fragmentModuleId, vertexBuffers, material, stencilKey) {
			return JSON.stringify([
				targetSignatureKey(sig),
				variantKey,
				vertexModuleId,
				fragmentModuleId,
				_vertexBuffersKey?.(vertexBuffers) ?? _serializeShaderVertexBuffers(vertexBuffers),
				material.needAlphaBlending,
				material.blendMode,
				material.blend ?? null,
				material.depthWrite,
				material.depthCompare,
				material.backFaceCulling,
				material.depthBias,
				material.depthBiasSlopeScale,
				material._topology,
				stencilKey
			]);
		}
	};
	_deviceCaches.set(device, cache);
	return cache;
}
/** @internal Canonical vertex-layout representation, unchanged by global sharing enablement. */
function _serializeShaderVertexBuffers(vertexBuffers) {
	return JSON.stringify(vertexBuffers.map((layout) => [
		layout.arrayStride,
		layout.stepMode ?? "vertex",
		Array.from(layout.attributes, (attribute) => [
			attribute.shaderLocation,
			attribute.offset,
			attribute.format
		])
	]));
}
function refresh(cache) {
	if (cache.localGeneration === _generation) return;
	cache.bindings.clear();
	cache.modules.clear();
	cache.localGeneration = _generation;
	cache.nextModuleId = 1;
}
function bindingsKey(material) {
	return JSON.stringify([
		material.attributes,
		_getShaderVbSupport()?._layouts(material) ?? null,
		material.uniformDecls.map((decl) => [decl.name, decl.type]),
		material.samplerDecls.map((decl) => [
			decl.name,
			decl.sampleType ?? "float",
			decl.viewDimension ?? "2d",
			decl.comparison === true
		]),
		material._externalTextureDecls ?? null,
		material.storageBufferDecls.map((decl) => [decl.name, decl.type])
	]);
}
export { _getShaderDeviceCache, _serializeShaderVertexBuffers, _setShaderVertexBuffersKey, clearShaderPipelineCache, enableShaderPipelineCache, retargetShaderPipelineCache };

//# sourceMappingURL=shader-pipeline-cache.js.map