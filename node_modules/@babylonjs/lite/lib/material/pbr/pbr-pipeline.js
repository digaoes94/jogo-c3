import { CW } from "../../engine/gpu-flags.js";
import "../../engine/render-target.js";
import { targetSignatureKey } from "../../engine/render-target-signature.js";
import { getSceneBindGroupLayout } from "../../render/scene-helpers.js";
import "../mesh-features.js";
import { PBR2_ESM_SHADOW_OUTPUT, PBR2_NO_COLOR_OUTPUT } from "./pbr-flag-bits.js";
import { _getPbrExtsSorted } from "./pbr-flags.js";
import { _getAlphaToCoverageResolver } from "../../render/alpha-to-coverage-hook.js";
import { _rightHanded } from "#coordinate-system";
// src/material/pbr/pbr-pipeline.ts
/** Dynamic PBR pipeline builder — creates and caches GPU render pipelines
*  based on per-mesh PBR feature flags + ComposedShader from the fragment system.
*
*  Two-tier cache:
*   - Shader bindings (BGLs + composed shader + per-sig pipeline cache) keyed by
*     `(features, features2)`. Sig-independent.
*   - Pipelines live inside each `_PbrShaderBindings`, keyed by `targetSignatureKey(sig)`.
*/
/** Stencil resolver, installed only by `enableMaterialStencil`. Module-local with a single exported setter:
*  when `enableMaterialStencil` is absent from the bundle the setter tree-shakes, the bundler proves this is
*  always null, and every stencil branch below folds away — stencil-free PBR scenes stay byte-identical. */
var _stencilResolver = null;
/** @internal Install the stencil resolver into the PBR pipeline (called by `enableMaterialStencil`). */
function _installPbrStencilResolver(resolve) {
	_stencilResolver = resolve;
}
/** Fallback-texture resolver, installed only by `createPbrMaterial` (called on every
*  use). Provides the shared 1×1 white default for a factor-only material's baseColor /
*  ORM slots (the shader always samples both). Module-local with a single exported setter:
*  glTF-only scenes never call `createPbrMaterial`, so the setter tree-shakes, the bundler
*  proves this is always null, and the `?? _pbrFallbackResolver?.(engine)` reads below fold
*  away — loader-driven PBR scenes (e.g. BoomBox) stay byte-identical. */
var _pbrFallbackResolver = null;
/** @internal Install the factor-only fallback-texture resolver (called by `createPbrMaterial`). */
function _installPbrFallbackResolver(resolve) {
	_pbrFallbackResolver = resolve;
}
/** IBL fallback resolver installed only by `enablePbrLocalCubemap`, keeping local
* fallback resolution behind the opt-in feature seam. */
var _pbrIblFallbackResolver = null;
/** @internal */
function _installPbrIblFallbackResolver(resolve) {
	_pbrIblFallbackResolver = resolve;
}
var bindingContext = null;
/** @internal Lazy scalar transport; null folds out of consumers without a scene-binding extension. */
var _pbrBindingIdentity = null;
/** @internal Auxiliary binding lifetime collections are allocated only by opted-in extensions. */
var _createPbrBindingDisposers = null;
/** @internal Install generic context transport without unconditional per-scene property reads or allocation. */
function _installPbrBindingContext(augment) {
	const previous = bindingContext;
	bindingContext = previous ? (context, id, disposers) => {
		previous(context, id, disposers);
		augment(context, id, disposers);
	} : augment;
	_pbrBindingIdentity = (id) => id;
	_createPbrBindingDisposers = () => [];
}
var _bindingsCache = /* @__PURE__ */ new Map();
var _cachedDevice = null;
function ensureDevice(engine) {
	if (_cachedDevice !== engine._device) {
		_bindingsCache.clear();
		_cachedDevice = engine._device;
	}
}
/** Clear the pipeline cache. Must be called when a GPU device is destroyed. */
function clearPbrPipelineCache() {
	_bindingsCache.clear();
	_cachedDevice = null;
}
/** Get-or-build the sig-independent PBR shader bindings. Used at renderable build time
*  so per-mesh bind groups can be created BEFORE any sig is known. */
function getOrCreatePbrBindings(engine, features, features2, meshFeatures, sceneFeatures, composed, shaderKey = "", stencil = null) {
	ensureDevice(engine);
	const resolvedStencil = stencil && _stencilResolver ? _stencilResolver(stencil) : null;
	const key = `${features}:${features2}:${meshFeatures}:${sceneFeatures}:${shaderKey}${resolvedStencil ? resolvedStencil._key : ""}`;
	const cached = _bindingsCache.get(key);
	if (cached) return cached;
	const device = engine._device;
	const meshBGL = device.createBindGroupLayout(composed._meshBGLDescriptor);
	let shadowBGL = null;
	if (composed._shadowBGLDescriptor) shadowBGL = device.createBindGroupLayout(composed._shadowBGLDescriptor);
	const bindings = {
		_features: features,
		_features2: features2,
		_meshFeatures: meshFeatures,
		_meshBGL: meshBGL,
		_shadowBGL: shadowBGL,
		_composed: composed,
		_pipelines: /* @__PURE__ */ new Map()
	};
	if (resolvedStencil) bindings._stencil = resolvedStencil._desc;
	_bindingsCache.set(key, bindings);
	return bindings;
}
/** Get-or-build the sig-specific pipeline on top of a PBR shader bindings. Called at bind() time. */
function getOrCreatePbrPipeline(engine, sig, bindings, material) {
	ensureDevice(engine);
	const alphaToCoverageResolver = _getAlphaToCoverageResolver();
	const useAlphaToCoverage = sig._sampleCount > 1 && !!alphaToCoverageResolver?.(material);
	const key = `${targetSignatureKey(sig)}${useAlphaToCoverage ? ":a2c" : ""}`;
	const cached = bindings._pipelines.get(key);
	if (cached) return cached;
	const device = engine._device;
	const { _features: features, _features2: features2, _composed: composed } = bindings;
	const esmShadowOutput = (features2 & PBR2_ESM_SHADOW_OUTPUT) !== 0;
	const hasAlpha = !esmShadowOutput && (features & 64) !== 0;
	const hasDoubleSided = (features & 256) !== 0;
	const sceneBGL = getSceneBindGroupLayout(engine);
	const bgls = bindings._shadowBGL ? [
		sceneBGL,
		bindings._meshBGL,
		bindings._shadowBGL
	] : [sceneBGL, bindings._meshBGL];
	const vertModule = alphaToCoverageResolver ? bindings._a2cVertModule ??= device.createShaderModule({ code: composed._vertexWGSL }) : device.createShaderModule({ code: composed._vertexWGSL });
	const noColorOutput = (features2 & PBR2_NO_COLOR_OUTPUT) !== 0;
	const fragModule = !sig._colorFormat && !noColorOutput ? null : alphaToCoverageResolver ? bindings._a2cFragModule ??= device.createShaderModule({ code: composed._fragmentWGSL }) : device.createShaderModule({ code: composed._fragmentWGSL });
	const fragTarget = noColorOutput ? null : {
		format: sig._colorFormat,
		writeMask: CW.ALL
	};
	if (hasAlpha && fragTarget) fragTarget.blend = {
		color: {
			srcFactor: "src-alpha",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		alpha: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "add"
		}
	};
	const pipeline = device.createRenderPipeline({
		layout: device.createPipelineLayout({ bindGroupLayouts: bgls }),
		vertex: {
			module: vertModule,
			entryPoint: "main",
			buffers: composed._vertexBufferLayouts
		},
		...fragModule ? { fragment: {
			module: fragModule,
			entryPoint: "main",
			targets: fragTarget ? [fragTarget] : []
		} } : {},
		...sig._depthStencilFormat ? { depthStencil: {
			format: sig._depthStencilFormat,
			depthCompare: sig._depthCompare ?? "greater-equal",
			depthWriteEnabled: noColorOutput || esmShadowOutput || !hasAlpha,
			..._stencilResolver && bindings._stencil && sig._depthStencilFormat.includes("stencil") ? bindings._stencil : {}
		} } : {},
		multisample: useAlphaToCoverage ? {
			count: sig._sampleCount,
			alphaToCoverageEnabled: true
		} : { count: sig._sampleCount },
		primitive: {
			cullMode: hasDoubleSided ? "none" : "back",
			...composed._prim,
			..._rightHanded && { frontFace: composed._prim?.frontFace === "cw" ? "ccw" : "cw" }
		}
	});
	bindings._pipelines.set(key, pipeline);
	return pipeline;
}
function createPbrMeshBindGroup(engine, bindings, composed, meshUBO, materialUBO, material, env, meshCtx, refractionTexture, lightingId, disposers) {
	const device = engine._device;
	const features = bindings._features;
	const features2 = bindings._features2;
	const meshFeatures = bindings._meshFeatures;
	const hasNormal = (features & 1) !== 0 && (meshFeatures & 1) !== 0;
	const hasCotangentNormal = (features & 1) !== 0 && (meshFeatures & 1) === 0;
	const hasAnyNormal = hasNormal || hasCotangentNormal;
	const hasEmissive = (features & 2) !== 0;
	const hasSpecGloss = (features & 128) !== 0;
	const esmShadowOutput = (features2 & PBR2_ESM_SHADOW_OUTPUT) !== 0;
	const entries = [];
	let b = 0;
	const addTex = (t) => {
		entries.push({
			binding: b++,
			resource: t.view
		});
		entries.push({
			binding: b++,
			resource: t.sampler
		});
	};
	const ctx = {
		_engine: engine,
		_features: features,
		_features2: features2,
		_meshFeatures: meshFeatures,
		_material: material,
		_mesh: meshCtx,
		_env: env ?? _pbrIblFallbackResolver?.(material) ?? null,
		_refractionTexture: refractionTexture
	};
	bindingContext?.(ctx, lightingId, disposers);
	const sortedExts = _getPbrExtsSorted();
	const fragIds = composed._fragmentKey ? composed._fragmentKey.split("|").filter((s) => s.length > 0) : [];
	entries.push({
		binding: b++,
		resource: { buffer: meshUBO }
	});
	entries.push({
		binding: b++,
		resource: { buffer: materialUBO }
	});
	for (const ext of sortedExts) if (ext.phase === "vertex" && ext.bind) b = ext.bind(ctx, entries, b);
	addTex(material.baseColorTexture ?? _pbrFallbackResolver?.(engine));
	if (hasAnyNormal) addTex(material.normalTexture);
	addTex(material.ormTexture ?? _pbrFallbackResolver?.(engine));
	if ((features2 & 2048) !== 0 && (meshFeatures & 128) !== 0 && material.occlusionTexture && material.occlusionTexCoord === 1) addTex(material.occlusionTexture);
	if (hasEmissive) addTex(material.emissiveTexture);
	if (hasSpecGloss) addTex(material.specGlossTexture);
	if (esmShadowOutput) entries.push({
		binding: b++,
		resource: { buffer: material._esmShadowParamsUBO }
	});
	const seenExts = [];
	for (const fid of fragIds) {
		const ext = sortedExts.find((e) => e.id === fid || fid.startsWith(e.id + "-"));
		if (!ext || ext.phase === "vertex" || !ext.bind || seenExts.includes(ext)) continue;
		seenExts.push(ext);
		b = ext.bind(ctx, entries, b);
	}
	return device.createBindGroup({
		layout: bindings._meshBGL,
		entries
	});
}
export { _createPbrBindingDisposers, _installPbrBindingContext, _installPbrFallbackResolver, _installPbrIblFallbackResolver, _installPbrStencilResolver, _pbrBindingIdentity, clearPbrPipelineCache, createPbrMeshBindGroup, getOrCreatePbrBindings, getOrCreatePbrPipeline };

//# sourceMappingURL=pbr-pipeline.js.map