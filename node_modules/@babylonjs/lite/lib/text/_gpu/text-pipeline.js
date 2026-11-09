import { _getAlphaToCoverageResolver } from "../../render/alpha-to-coverage-hook.js";
import "../text-data.js";
import { composeSlugShader } from "../shaders/slug-shader.js";
// src/text/_gpu/text-pipeline.ts
/** @internal Resolves the installed styling feature's compiled module pair for a device.
*  Null until an opt-in feature installs one, and while null no variant pipeline key is
*  ever produced and no variant pipeline is ever created, so a base draw is unaffected.
*  One styling feature at a time: installing a second replaces the first. */
var _textVariantResolver = null;
/** @internal Install the variant resolver. Called from inside an opt-in setter (never at
*  module scope) so importing this module has no effect. */
function _installTextVariantResolver(resolve) {
	_textVariantResolver = resolve;
}
var _cache = null;
/** Clear the text pipeline cache for a device, releasing cache-held refs. */
function clearTextPipelineCache(engine) {
	_cache?.delete(engine._device);
}
/** Shared 4-vertex unit quad: corner signs (-1,-1), (1,-1), (1,1), (-1,1). */
var QUAD_CORNERS = [
	-1,
	-1,
	1,
	-1,
	1,
	1,
	-1,
	-1,
	1,
	1,
	-1,
	1
];
/**
* Pipeline-constant ID of the `a2c` override in the Slug fragment shader, declared as `@id(0)`.
*
* Deliberately keyed by number, not by name: the shader is an opaque string to JS minifiers,
* so an unquoted `{ a2c: 1 }` key would be property-mangled by Closure ADVANCED while the WGSL
* text kept `a2c`, and A2C pipeline creation would fail in those builds. Numeric keys survive
* mangling, and WebGPU requires the numeric key once `@id` is specified.
*/
var A2C_CONSTANT_ID = 0;
/** @internal Per-device bind group layout, base shader modules and shared quad buffer.
*  Draw paths that only need the quad buffer or the bind-group layout call this directly
*  rather than `getOrCreateTextPipeline`, which would build cache keys they never use. */
function getTextPipelineCache(engine) {
	_cache ??= /* @__PURE__ */ new WeakMap();
	let cache = _cache.get(engine._device);
	if (cache) return cache;
	const device = engine._device;
	const bindGroupLayout = device.createBindGroupLayout({
		label: "text-bind-group-layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: { type: "uniform" }
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				texture: { sampleType: "unfilterable-float" }
			},
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				texture: { sampleType: "uint" }
			},
			{
				binding: 3,
				visibility: GPUShaderStage.VERTEX,
				buffer: { type: "read-only-storage" }
			},
			{
				binding: 4,
				visibility: GPUShaderStage.VERTEX,
				buffer: { type: "read-only-storage" }
			}
		]
	});
	const base = composeSlugShader(null);
	const vertModule = device.createShaderModule({
		label: "text-vert",
		code: base._vert
	});
	const fragModule = device.createShaderModule({
		label: "text-frag",
		code: base._frag
	});
	const corners = new Float32Array(QUAD_CORNERS);
	const quadVertexBuffer = device.createBuffer({
		label: "text-quad-corners",
		size: corners.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		mappedAtCreation: true
	});
	new Float32Array(quadVertexBuffer.getMappedRange()).set(corners);
	quadVertexBuffer.unmap();
	cache = {
		_bindGroupLayout: bindGroupLayout,
		_vertModule: vertModule,
		_fragModule: fragModule,
		_quadVertexBuffer: quadVertexBuffer,
		_pipelines: /* @__PURE__ */ new Map()
	};
	_cache.set(device, cache);
	return cache;
}
/** @internal Fixed-arity pipeline cache key: seven `:`-separated fields, every one always
*  present. There is no optional field and no delimiter alias, so a base alpha-to-coverage
*  pipeline (`…:a:-`) can never produce the same string as a variant whose id is `"a"`
*  (`…:-:a`). Exported for the collision regression test. */
function _textPipelineKey(format, sampleCount, depthStencilFormat, depthWrite, alphaToCoverage, variantId, depthCompare = "greater-equal") {
	return format + ":" + sampleCount + ":" + (depthStencilFormat ?? "-") + ":" + (depthStencilFormat ? depthCompare : "-") + ":" + (depthWrite ? "w" : "r") + ":" + (alphaToCoverage ? "a" : "-") + ":" + variantId;
}
function buildPipeline(device, cache, format, sampleCount, depthStencilFormat, depthWrite, alphaToCoverage, variant, depthCompare) {
	const key = _textPipelineKey(format, sampleCount, depthStencilFormat, depthWrite, alphaToCoverage, variant ? variant._id : "-", depthCompare);
	let pipeline = cache._pipelines.get(key);
	if (pipeline) return pipeline;
	const descriptor = {
		label: "text-pipeline",
		layout: device.createPipelineLayout({ bindGroupLayouts: [cache._bindGroupLayout] }),
		vertex: {
			module: variant ? variant._vertModule : cache._vertModule,
			entryPoint: "main",
			buffers: [{
				arrayStride: 8,
				stepMode: "vertex",
				attributes: [{
					shaderLocation: 0,
					offset: 0,
					format: "float32x2"
				}]
			}, {
				arrayStride: 12,
				stepMode: "instance",
				attributes: [{
					shaderLocation: 1,
					offset: 0,
					format: "float32x2"
				}, {
					shaderLocation: 2,
					offset: 8,
					format: "uint32"
				}]
			}]
		},
		fragment: {
			module: variant ? variant._fragModule : cache._fragModule,
			entryPoint: "main",
			...alphaToCoverage ? { constants: { [A2C_CONSTANT_ID]: 1 } } : {},
			targets: [{
				format,
				...alphaToCoverage ? {} : { blend: {
					color: {
						srcFactor: "one",
						dstFactor: "one-minus-src-alpha",
						operation: "add"
					},
					alpha: {
						srcFactor: "one",
						dstFactor: "one-minus-src-alpha",
						operation: "add"
					}
				} }
			}]
		},
		primitive: {
			topology: "triangle-list",
			cullMode: "none",
			frontFace: "ccw"
		},
		multisample: alphaToCoverage ? {
			count: sampleCount,
			alphaToCoverageEnabled: true
		} : { count: sampleCount }
	};
	if (depthStencilFormat) descriptor.depthStencil = {
		format: depthStencilFormat,
		depthCompare,
		depthWriteEnabled: depthWrite
	};
	pipeline = device.createRenderPipeline(descriptor);
	cache._pipelines.set(key, pipeline);
	return pipeline;
}
function getOrCreateTextPipeline(engine, format, sampleCount, depthStencilFormat, depthWrite, owner, depthCompare = "greater-equal") {
	const cache = getTextPipelineCache(engine);
	const alphaToCoverageResolver = _getAlphaToCoverageResolver();
	const alphaToCoverage = depthWrite && sampleCount > 1 && !!owner && !!alphaToCoverageResolver?.(owner);
	const device = engine._device;
	const pipeline = buildPipeline(device, cache, format, sampleCount, depthStencilFormat, depthWrite, alphaToCoverage, null, depthCompare);
	let variantPipeline = pipeline;
	if (_textVariantResolver) variantPipeline = buildPipeline(device, cache, format, sampleCount, depthStencilFormat, depthWrite, alphaToCoverage, _textVariantResolver(device), depthCompare);
	return {
		_pipeline: pipeline,
		_variantPipeline: variantPipeline,
		_cache: cache
	};
}
export { _installTextVariantResolver, _textPipelineKey, _textVariantResolver, clearTextPipelineCache, getOrCreateTextPipeline, getTextPipelineCache };

//# sourceMappingURL=text-pipeline.js.map