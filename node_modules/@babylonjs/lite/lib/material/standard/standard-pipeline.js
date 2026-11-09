import { F32 } from "../../engine/typed-arrays.js";
import "../../engine/render-target.js";
import { createUniformBuffer } from "../../resource/uniform-buffer.js";
import { targetSignatureKey } from "../../engine/render-target-signature.js";
import { getSceneBindGroupLayout } from "../../render/scene-helpers.js";
import "../mesh-features.js";
import { _getAlphaToCoverageResolver } from "../../render/alpha-to-coverage-hook.js";
import { composeShader } from "../../shader/shader-composer.js";
import { DIFFUSE_USES_UV2, DISABLE_LIGHTING, ESM_SHADOW_OUTPUT, NEEDS_UV2, NO_COLOR_OUTPUT, _getStdExtsSorted, _stdSceneLightingSource } from "./standard-flags.js";
import { createStandardTemplate } from "./standard-template.js";
import { _rightHanded } from "#coordinate-system";
// src/material/standard/standard-pipeline.ts
/** Dynamic StandardMaterial pipeline builder — creates and caches GPU render
*  pipelines based on per-material feature flags.
*
*  Feature flags (bitmask):
*    HAS_DIFFUSE_TEXTURE  — diffuse texture sampling + UV attribute
*    HAS_EMISSIVE_TEXTURE — emissive texture sampling + UV attribute
*  Derived flag (computed automatically):
*    NEEDS_UV = HAS_DIFFUSE_TEXTURE | HAS_EMISSIVE_TEXTURE
*
*  Pipelines are cached per (features, format, msaaSamples) tuple.
*  Shared scene UBO layout is identical across all variants (176 bytes). */
/** Stencil resolver, installed only by `enableMaterialStencil`. Module-local with a single exported setter:
*  when `enableMaterialStencil` is absent from the bundle the setter tree-shakes, the bundler proves this is
*  always null, and every stencil branch below folds away — stencil-free Standard scenes stay byte-identical. */
var _stencilResolver = null;
var _uvOffsetResolver = null;
/** @internal Install the stencil resolver into the Standard pipeline (called by `enableMaterialStencil`). */
function _installStandardStencilResolver(resolve) {
	_stencilResolver = resolve;
}
/** Vertex-color fragment factory installed only by `enableStandardVertexColors`. RGB is always
*  applied; the `hasVertexAlpha` argument (Babylon `VERTEXALPHA`, from `mesh.hasVertexAlpha`) gates
*  the fragment's `alpha *= vColor.a` + vertex-alpha alpha-test. `hasDiffuse` selects the alpha-test
*  source. Installed by the canonical `enableStandardVertexColors()` (master #430) opt-in. */
var _stdVertexColorFragment = null;
/** @internal Install Standard mesh vertex-color shader support (called by `enableStandardVertexColors`). */
function _installStdVertexColorFragment(factory) {
	_stdVertexColorFragment = factory;
}
/** @internal Install optional Standard UV-offset reads. */
function _installStandardUvOffsetResolver(resolve) {
	_uvOffsetResolver = resolve;
}
/** Primitive-state resolver, installed only by `std-mirrored-support` — i.e. the
*  `enableMirroredMeshes()` opt-in — so that a mirrored Standard mesh gets its triangle winding
*  reversed. (The shared resolver it installs also threads non-triangle topology, but that only
*  ever comes from glTF primitives, which are PBR; a Standard mesh always resolves to a
*  triangle list.) Module-local with a single exported setter: when the opt-in is absent the setter
*  tree-shakes, the bundler proves this is always null, and the ternary in
*  `getOrCreateStandardPipeline` folds to the plain triangle-list default — every ordinary Standard
*  scene stays byte-identical. */
var _stdPrimitiveResolver = null;
/** @internal Install the Standard primitive-state resolver. */
function _installStdPrimitiveResolver(resolve) {
	_stdPrimitiveResolver = resolve;
}
/** Compose Standard shader via the generic ShaderComposer.
*  @param fragments - Optional extra fragments (e.g. thin-instance). */
function composeStandardShader(features, _meshFeatures = 0, fragments = [], esmShadowDepthCode = "", sceneShader = null, meshVertexLayout) {
	const has = (bit) => !!(features & bit);
	const template = createStandardTemplate({
		_diffuse: has(1),
		_needsUV: has(127),
		_needsUV2: has(NEEDS_UV2),
		_diffuseUsesUV2: has(DIFFUSE_USES_UV2),
		_disableLighting: has(DISABLE_LIGHTING),
		_noColorOutput: has(NO_COLOR_OUTPUT),
		_esmShadowOutput: has(ESM_SHADOW_OUTPUT),
		_hasMorph: !!(_meshFeatures & 8),
		_lightingFunction: _stdSceneLightingSource?.(sceneShader?._lightingFunction)
	}, esmShadowDepthCode);
	return fragments.reduce((composed, fragment) => fragment._pc?.(composed) ?? composed, composeShader(template, sceneShader ? [...fragments, ...sceneShader._fragments] : fragments, meshVertexLayout));
}
/** Per-(features:fk) shader bindings cache (sig-independent). */
var _bindingsCache = /* @__PURE__ */ new Map();
var _composedCache = null;
var _cachedDevice = null;
function getComposedCache() {
	if (!_composedCache) _composedCache = /* @__PURE__ */ new Map();
	return _composedCache;
}
function ensureDevice(engine) {
	if (_cachedDevice !== engine._device) {
		_bindingsCache.clear();
		_composedCache?.clear();
		_cachedDevice = engine._device;
	}
}
/** Clear the pipeline cache. Must be called when a GPU device is destroyed. */
function clearStandardPipelineCache() {
	_bindingsCache.clear();
	_composedCache?.clear();
	_cachedDevice = null;
}
/** Get-or-build the sig-independent shader bindings for a given feature/fragment set.
*  Used at renderable build time so per-mesh bind groups can be created BEFORE the
*  first bind() call (when sig is known). */
function getOrCreateStandardBindings(engine, features, meshFeatures, fragments = [], shaderKey = "", esmShadowDepthCode = "", stencil = null, sceneShader = null, meshVertexLayout, meshVertexKey = "") {
	ensureDevice(engine);
	const resolvedStencil = stencil && _stencilResolver ? _stencilResolver(stencil) : null;
	const sceneFeatures = sceneShader?._features ?? 0;
	const key = standardFeatureKey(features, meshFeatures, sceneFeatures, shaderKey) + meshVertexKey + (resolvedStencil ? resolvedStencil._key : "");
	const cached = _bindingsCache.get(key);
	if (cached) return cached;
	const cc = getComposedCache();
	let composed = cc.get(key);
	if (!composed) {
		composed = composeStandardShader(features, meshFeatures, fragments, esmShadowDepthCode, sceneShader, meshVertexLayout);
		cc.set(key, composed);
	}
	const device = engine._device;
	const meshBGL = device.createBindGroupLayout(composed._meshBGLDescriptor);
	let shadowBGL = null;
	if (!!(meshFeatures & 256) && composed._shadowBGLDescriptor) shadowBGL = device.createBindGroupLayout(composed._shadowBGLDescriptor);
	const bindings = {
		_features: features,
		_meshFeatures: meshFeatures,
		_sceneFeatures: sceneFeatures,
		_meshBGL: meshBGL,
		_shadowBGL: shadowBGL,
		_composed: composed,
		_pipelines: /* @__PURE__ */ new Map()
	};
	if (resolvedStencil) bindings._stencil = resolvedStencil._desc;
	_bindingsCache.set(key, bindings);
	return bindings;
}
function standardFeatureKey(features, meshFeatures, sceneFeatures, variant) {
	return variant ? `${features}:${meshFeatures}:${sceneFeatures}:${variant}` : `${features}:${meshFeatures}:${sceneFeatures}`;
}
/** Get-or-build a sig-specific pipeline on top of a shader bindings. Called at bind() time. */
function getOrCreateStandardPipeline(engine, sig, bindings, material) {
	ensureDevice(engine);
	const alphaToCoverageResolver = _getAlphaToCoverageResolver();
	const useAlphaToCoverage = sig._sampleCount > 1 && !!alphaToCoverageResolver?.(material);
	const key = `${targetSignatureKey(sig)}${useAlphaToCoverage ? ":a2c" : ""}`;
	const cached = bindings._pipelines.get(key);
	if (cached) return cached;
	const device = engine._device;
	const composed = bindings._composed;
	const features = bindings._features;
	const sceneBGL = getSceneBindGroupLayout(engine);
	const bgls = bindings._shadowBGL ? [
		sceneBGL,
		bindings._meshBGL,
		bindings._shadowBGL
	] : [sceneBGL, bindings._meshBGL];
	const vertModule = alphaToCoverageResolver ? bindings._a2cVertModule ??= device.createShaderModule({ code: composed._vertexWGSL }) : device.createShaderModule({ code: composed._vertexWGSL });
	const noColorOutput = !!(features & NO_COLOR_OUTPUT);
	const esmShadowOutput = !!(features & ESM_SHADOW_OUTPUT);
	const fragModule = !sig._colorFormat && !noColorOutput ? null : alphaToCoverageResolver ? bindings._a2cFragModule ??= device.createShaderModule({ code: composed._fragmentWGSL }) : device.createShaderModule({ code: composed._fragmentWGSL });
	const needsBlend = !esmShadowOutput && (features & 64 || features & 65536);
	const colorTarget = noColorOutput ? null : needsBlend ? {
		format: sig._colorFormat,
		blend: {
			color: {
				srcFactor: "src-alpha",
				dstFactor: "one-minus-src-alpha"
			},
			alpha: {
				srcFactor: "one",
				dstFactor: "one-minus-src-alpha"
			}
		}
	} : { format: sig._colorFormat };
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
			targets: colorTarget ? [colorTarget] : []
		} } : {},
		...sig._depthStencilFormat ? { depthStencil: {
			format: sig._depthStencilFormat,
			depthCompare: sig._depthCompare ?? "greater-equal",
			depthWriteEnabled: noColorOutput || esmShadowOutput || !needsBlend,
			..._stencilResolver && bindings._stencil && sig._depthStencilFormat.includes("stencil") ? bindings._stencil : {}
		} } : {},
		multisample: useAlphaToCoverage ? {
			count: sig._sampleCount,
			alphaToCoverageEnabled: true
		} : { count: sig._sampleCount },
		primitive: _stdPrimitiveResolver ? _stdPrimitiveResolver(bindings._meshFeatures, (features & 512) !== 0) : {
			topology: "triangle-list",
			cullMode: features & 512 ? "none" : "back",
			frontFace: _rightHanded ? bindings._meshFeatures & 2048 ? "ccw" : "cw" : "ccw"
		}
	});
	bindings._pipelines.set(key, pipeline);
	return pipeline;
}
/** Build the per-mesh material bind group (group 1). The mesh UBO
*  and material UBO are created/owned by the caller — this
*  function only assembles the bind group entries that match the composer's
*  binding layout.
*
*  Mirrors `createPbrMeshBindGroup` in pbr-pipeline.ts. */
function createStandardMeshBindGroup(scene, bindings, meshUBO, materialUBO, material, morphTargets = null, mesh, disposers, auxiliary = false) {
	const engine = scene.surface.engine;
	const device = engine._device;
	const features = bindings._features;
	const hasDiffuseTex = features & 1;
	const esmShadowOutput = features & ESM_SHADOW_OUTPUT;
	let nextBinding = 0;
	const entries = [{
		binding: nextBinding++,
		resource: { buffer: meshUBO }
	}];
	if (morphTargets) entries.push({
		binding: nextBinding++,
		resource: { buffer: morphTargets.deltasBuffer }
	}, {
		binding: nextBinding++,
		resource: { buffer: morphTargets.weightsBuffer }
	});
	entries.push({
		binding: nextBinding++,
		resource: { buffer: materialUBO }
	});
	if (hasDiffuseTex) {
		const tex = material.diffuseTexture;
		entries.push({
			binding: nextBinding++,
			resource: tex.texture.createView()
		}, {
			binding: nextBinding++,
			resource: tex.sampler
		});
	}
	if (features & 127) {
		const uvData = new F32(4);
		writeStandardUvTransformData(uvData, material, isStandardUvInverted(features, material));
		const uvBuffer = createUniformBuffer(engine, uvData);
		disposers?.push(() => uvBuffer.destroy());
		entries.push({
			binding: nextBinding++,
			resource: { buffer: uvBuffer }
		});
	}
	if (esmShadowOutput) entries.push({
		binding: nextBinding++,
		resource: { buffer: material._esmShadowParamsUBO }
	});
	for (const ext of _getStdExtsSorted()) if (features & ext._feature && ext._bind) nextBinding = ext._bind(material, entries, nextBinding, mesh, scene, disposers, auxiliary);
	return device.createBindGroup({
		layout: bindings._meshBGL,
		entries
	});
}
/** @internal Write `(scaleX, scaleY, offsetX, offsetY)` with safe optional offsets. */
function writeStandardUvTransformData(data, material, invertY) {
	const offset = _uvOffsetResolver?.(material) ?? null;
	const scaleX = material.uvScale[0];
	let scaleY = material.uvScale[1];
	const offsetX = offset?.[0] ?? 0;
	let offsetY = offset?.[1] ?? 0;
	if (invertY) {
		offsetY += scaleY;
		scaleY = -scaleY;
	}
	data[0] = scaleX;
	data[1] = scaleY;
	data[2] = offsetX;
	data[3] = offsetY;
}
/** @internal Resolve the shared UV transform's source-texture orientation. */
function isStandardUvInverted(features, material) {
	if (features & 1 && material.diffuseTexture) return material.diffuseTexture.invertY === true;
	if (features & 64 && material._opacityTexture) return material._opacityTexture.invertY === true;
	return !!(features & 4) && material._bumpTexture?.invertY === true;
}
/** Write standard material properties into a pre-allocated Float32Array (24 floats). */
function writeStdMaterialData(data, mat, textureLevel) {
	const { diffuseColor: dc, specularColor: sc, emissiveColor: ec, ambientColor: ac } = mat;
	data[0] = dc[0];
	data[1] = dc[1];
	data[2] = dc[2];
	data[3] = mat.alpha;
	data[4] = sc[0];
	data[5] = sc[1];
	data[6] = sc[2];
	data[7] = mat.specularPower;
	data[8] = ec[0];
	data[9] = ec[1];
	data[10] = ec[2];
	data[11] = 1 / mat.bumpLevel;
	data[12] = ac[0];
	data[13] = ac[1];
	data[14] = ac[2];
	data[15] = textureLevel;
	data[16] = mat.ambientTexLevel;
	data[17] = mat.lightmapLevel;
	data[18] = mat.opacityLevel;
	data[19] = mat.alphaCutOff;
	data[20] = mat.reflectionLevel;
	data[21] = mat.reflectionCoordMode;
	for (const ext of _getStdExtsSorted()) ext._writeUbo?.(data, mat);
}
export { _installStandardStencilResolver, _installStandardUvOffsetResolver, _installStdPrimitiveResolver, _installStdVertexColorFragment, _stdVertexColorFragment, clearStandardPipelineCache, composeStandardShader, createStandardMeshBindGroup, getOrCreateStandardBindings, getOrCreateStandardPipeline, isStandardUvInverted, writeStandardUvTransformData, writeStdMaterialData };

//# sourceMappingURL=standard-pipeline.js.map