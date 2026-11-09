import { PBR2_ESM_SHADOW_OUTPUT, PBR2_HAS_BASE_COLOR_FACTOR, PBR2_HAS_REFLECTANCE_FACTORS, PBR2_HAS_REFRACTION, PBR2_HAS_UV2, PBR2_HAS_UV_TRANSFORM, PBR2_NO_COLOR_OUTPUT, PBR_HAS_ALPHA_BLEND, PBR_HAS_ALPHA_TEST, PBR_HAS_ANISOTROPY, PBR_HAS_COTANGENT_NORMAL, PBR_HAS_DOUBLE_SIDED, PBR_HAS_EMISSIVE, PBR_HAS_EMISSIVE_COLOR, PBR_HAS_ENV, PBR_HAS_FOG, PBR_HAS_GAMMA_ALBEDO, PBR_HAS_METALLIC_REFLECTANCE_MAP, PBR_HAS_NORMAL_MAP, PBR_HAS_OCCLUSION, PBR_HAS_REFLECTANCE_MAP, PBR_HAS_SHEEN, PBR_HAS_SKYBOX, PBR_HAS_SPECULAR_AA, PBR_HAS_SPEC_GLOSS, PBR_HAS_SUBSURFACE, PBR_HAS_THICKNESS_MAP, PBR_HAS_TONEMAP, PBR_HAS_USE_ALPHA_ONLY_MR } from "./pbr-flag-bits.js";
// src/material/pbr/pbr-flags.ts
var _pbrExts = null;
var _pbrExtsSorted = null;
/** @internal Register a PBR extension. Idempotent (keyed by id). */
function _registerPbrExt(ext) {
	(_pbrExts ??= /* @__PURE__ */ new Map()).set(ext.id, ext);
	_pbrExtsSorted = null;
}
/** @internal Iterate the registered extensions. */
function _getPbrExts() {
	return _pbrExts ??= /* @__PURE__ */ new Map();
}
/** @internal Return extensions sorted by id (alphabetical, stable within a build). Memoised. */
function _getPbrExtsSorted() {
	if (!_pbrExtsSorted) {
		const map = _pbrExts;
		_pbrExtsSorted = map ? Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id)) : [];
	}
	return _pbrExtsSorted;
}
var _pbrSceneHooks = null;
/** @internal Register a scene-setup hook. Idempotent (keyed by function identity). */
function _registerPbrSceneHook(hook) {
	(_pbrSceneHooks ??= /* @__PURE__ */ new Set()).add(hook);
}
/** @internal Iterate the registered scene-setup hooks. */
function _getPbrSceneHooks() {
	return _pbrSceneHooks ?? [];
}
export { PBR2_ESM_SHADOW_OUTPUT, PBR2_HAS_BASE_COLOR_FACTOR, PBR2_HAS_REFLECTANCE_FACTORS, PBR2_HAS_REFRACTION, PBR2_HAS_UV2, PBR2_HAS_UV_TRANSFORM, PBR2_NO_COLOR_OUTPUT, PBR_HAS_ALPHA_BLEND, PBR_HAS_ALPHA_TEST, PBR_HAS_ANISOTROPY, PBR_HAS_COTANGENT_NORMAL, PBR_HAS_DOUBLE_SIDED, PBR_HAS_EMISSIVE, PBR_HAS_EMISSIVE_COLOR, PBR_HAS_ENV, PBR_HAS_FOG, PBR_HAS_GAMMA_ALBEDO, PBR_HAS_METALLIC_REFLECTANCE_MAP, PBR_HAS_NORMAL_MAP, PBR_HAS_OCCLUSION, PBR_HAS_REFLECTANCE_MAP, PBR_HAS_SHEEN, PBR_HAS_SKYBOX, PBR_HAS_SPECULAR_AA, PBR_HAS_SPEC_GLOSS, PBR_HAS_SUBSURFACE, PBR_HAS_THICKNESS_MAP, PBR_HAS_TONEMAP, PBR_HAS_USE_ALPHA_ONLY_MR, _getPbrExts, _getPbrExtsSorted, _getPbrSceneHooks, _registerPbrExt, _registerPbrSceneHook };

//# sourceMappingURL=pbr-flags.js.map