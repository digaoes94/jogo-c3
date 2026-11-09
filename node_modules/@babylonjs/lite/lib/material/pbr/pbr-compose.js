import "../mesh-features.js";
import { PBR2_ESM_SHADOW_OUTPUT, PBR2_HAS_BASE_COLOR_FACTOR, PBR2_NO_COLOR_OUTPUT, PBR_HAS_ANISOTROPY, PBR_HAS_EMISSIVE_COLOR, PBR_HAS_GAMMA_ALBEDO, PBR_HAS_SPECULAR_AA } from "./pbr-flag-bits.js";
import { _getPbrExts } from "./pbr-flags.js";
import { composeShader } from "../../shader/shader-composer.js";
import { createPbrTemplate } from "./pbr-template.js";
// src/material/pbr/pbr-compose.ts
/** @internal Lazily loaded WGSL paths a variant composes. */
var PBR_LAZY_TANGENT_NORMAL = 2;
var PBR_LAZY_COTANGENT_NORMAL = 4;
var PBR_LAZY_SPEC_GLOSS = 8;
/** @internal The single rule mapping feature bits to the lazy WGSL modules a variant needs — shared by
*  `composePbr` (which consumes the modules) and the group build (which decides which ones to load). */
function _pbrLazyWgslNeeds(features, meshFeatures) {
	return ((features & 1) !== 0 ? (meshFeatures & 1) !== 0 ? 2 : 4 : 0) | ((features & 128) !== 0 ? 8 : 0);
}
/** @internal The key a composer caches a variant under: also how `_pbrRebuildsComposed` asks whether one was composed. */
function _pbrComposeKey(features, features2, meshFeatures, sceneFeatures, lightMode, singleLightType, vbKey, uv2Mask, pluginIndex) {
	return `${features}:${features2}:${meshFeatures}:${sceneFeatures}:${lightMode}:${singleLightType}${vbKey}:${uv2Mask}:${pluginIndex}`;
}
/** Local-IBL resolver installed only by `enablePbrLocalCubemap`, keeping extension
* detection behind the opt-in feature seam instead of scanning every PBR extension. */
var _extensionIblResolver = null;
/** @internal */
function _installPbrExtensionIblResolver(resolve) {
	_extensionIblResolver = resolve;
}
/** Create a memoized shader composer for a given scene's resolved PBR deps. */
function createPbrComposer(deps) {
	const cache = /* @__PURE__ */ new Map();
	const { _singleLightWGSL, _getSingleLightBlock, _multiLightWGSL, _multiLightLoop, _tm, _fogHelper, _fogBlock, _createPbrTemplateExt, _flatNormalWgsl, _tangentNormal, _cotangentNormal, _specGloss, _createPbrShadowFragment, _shadowLights, _createThinInstanceFragment } = deps;
	function composePbr(features, features2 = 0, meshFeatures = 0, sceneFeatures = 0, lightMode = 0, singleLightType = "", _esmShadowDepthCode = "", vbStrides, vbKey = "", uv2Mask = 0, pluginIndex = 0) {
		const ckey = _pbrComposeKey(features, features2, meshFeatures, sceneFeatures, lightMode, singleLightType, vbKey, uv2Mask, pluginIndex);
		const cached = cache.get(ckey);
		if (cached) return cached;
		const has = (bit) => (features & bit) !== 0;
		const hasMesh = (bit) => (meshFeatures & bit) !== 0;
		const hasScene = (bit) => (sceneFeatures & bit) !== 0;
		const lazyNeeds = _pbrLazyWgslNeeds(features, meshFeatures);
		const hasNormal = (lazyNeeds & 2) !== 0;
		const hasCotangent = (lazyNeeds & 4) !== 0;
		const _hasAnyNormal = hasNormal || hasCotangent;
		const hasSpecGloss = (lazyNeeds & 8) !== 0;
		const _hasReflectanceExt = has(3072) || (features2 & 1024) !== 0;
		const extensionIbl = _extensionIblResolver?.(features, features2) ?? false;
		const _hasIbl = hasScene(4) || extensionIbl;
		const _hasMorph = hasMesh(8);
		const hasShadow = hasMesh(256);
		const _hasAnisotropy = has(PBR_HAS_ANISOTROPY);
		const _anisoHooks = _hasAnisotropy ? _getPbrExts().get("anisotropy") : void 0;
		const _gammaHooks = has(33554432) ? _getPbrExts().get("gamma-albedo") : void 0;
		const _skyboxHooks = has(536870912) ? _getPbrExts().get("skybox") : void 0;
		const _hasEmissiveColor = has(PBR_HAS_EMISSIVE_COLOR);
		const _hasEmissiveTexture = has(2);
		const hasTI = hasMesh(16);
		const _hasUvTransform = (features2 & 512) !== 0;
		const _hasVertexColor = hasMesh(64);
		const _hasUv2 = (features2 & 2048) !== 0 && hasMesh(128);
		const needsExt = _hasUvTransform || _hasVertexColor || _hasUv2;
		const _hasSpecularAA = has(PBR_HAS_SPECULAR_AA);
		const _ext = needsExt && _createPbrTemplateExt ? _createPbrTemplateExt({
			_hasUvTransform,
			_hasVertexColor,
			_hasUv2,
			_uv2Mask: uv2Mask,
			_features2: features2,
			_hasAnyNormal,
			_hasEmissiveTexture,
			_hasSpecGloss: hasSpecGloss
		}) : void 0;
		const template = createPbrTemplate({
			_hasSingleLight: lightMode === 1,
			_hasMultiLight: lightMode === 2,
			_singleLightWGSL,
			_singleLightBlock: lightMode === 1 && _getSingleLightBlock ? _getSingleLightBlock(singleLightType) : "",
			_multiLightWGSL,
			_multiLightLoop,
			_tangentNormal: hasNormal ? _tangentNormal : void 0,
			_cotangentNormal: hasCotangent ? _cotangentNormal : void 0,
			_flatGeometricNormal: !_hasAnyNormal && hasMesh(1024),
			_flatNormalWgsl,
			_hasEmissiveTexture,
			_specGloss: hasSpecGloss ? _specGloss : void 0,
			_hasDoubleSided: has(256),
			_hasTonemap: hasScene(16),
			_fogHelper: hasScene(32) ? _fogHelper : "",
			_fogBlock: hasScene(32) ? _fogBlock : "",
			_toneMappingHelpers: _tm?.helpersWGSL,
			_toneMappingCall: _tm?.callWGSL,
			_hasAlphaBlend: has(64),
			_hasSpecularAA,
			_hasGammaAlbedo: has(PBR_HAS_GAMMA_ALBEDO),
			_hasBaseColorFactor: (features2 & PBR2_HAS_BASE_COLOR_FACTOR) !== 0,
			_hasMorph,
			_hasOcclusion: has(32768) && !_hasReflectanceExt,
			_hasEmissiveColor,
			_hasReflectanceExt,
			_hasIbl,
			_hasAnisotropy,
			_anisoBrdfFunctions: _anisoHooks?._anisoBrdf,
			_anisoTBBlock: _anisoHooks?._anisoTB(hasNormal, (features2 & _anisoHooks._anisoTexBit) !== 0),
			_ext,
			_gammaBaseColor: _gammaHooks?._gammaBaseColor,
			_noColorOutput: (features2 & PBR2_NO_COLOR_OUTPUT) !== 0,
			_esmShadowOutput: (features2 & PBR2_ESM_SHADOW_OUTPUT) !== 0,
			_esmShadowDepthCode
		});
		const frags = [];
		const fragCtx = {
			_sceneFeatures: sceneFeatures,
			_lightMode: lightMode,
			_features: features,
			_features2: features2,
			_pi: pluginIndex,
			_meshFeatures: meshFeatures,
			_uv2Mask: _hasUv2 ? uv2Mask : 0,
			_hasIbl,
			_hasAnyNormal,
			_hasSpecularAA,
			_anisoBentNormalCode: _anisoHooks?._anisoBentNormal,
			_iblSkyboxCalc: _skyboxHooks?._skyboxCalc
		};
		if (extensionIbl) fragCtx._hasSceneIbl = hasScene(4);
		for (const regExt of _getPbrExts().values()) if (regExt.frag) {
			const fr = regExt.frag(fragCtx);
			if (fr) frags.push(fr);
		}
		if (hasShadow && _createPbrShadowFragment) {
			const slots = _shadowLights.map((sl) => ({
				lightIndex: sl.lightIndex,
				shadowType: sl.shadowType
			}));
			frags.push(_createPbrShadowFragment(slots));
		}
		if (hasTI && _createThinInstanceFragment) frags.push(_createThinInstanceFragment(hasMesh(32)));
		const composed = frags.reduce((shader, fragment) => fragment._pc?.(shader) ?? shader, composeShader(template, frags, vbStrides));
		cache.set(ckey, composed);
		return composed;
	}
	return Object.assign(composePbr, { _c: cache });
}
export { PBR_LAZY_COTANGENT_NORMAL, PBR_LAZY_SPEC_GLOSS, PBR_LAZY_TANGENT_NORMAL, _installPbrExtensionIblResolver, _pbrComposeKey, _pbrLazyWgslNeeds, createPbrComposer };

//# sourceMappingURL=pbr-compose.js.map