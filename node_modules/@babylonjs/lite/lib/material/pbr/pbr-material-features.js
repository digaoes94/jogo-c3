import { PBR2_HAS_BASE_COLOR_FACTOR, PBR2_HAS_UV2, PBR_HAS_OCCLUSION, PBR_HAS_SPECULAR_AA } from "./pbr-flag-bits.js";
import { _getPbrExts } from "./pbr-flags.js";
// src/material/pbr/pbr-material-features.ts
/** @internal Compute PBR material-only feature bits. Mesh/pass bits are added per renderable. */
function _computePbrMaterialFeatures(mat) {
	let features = (mat.emissiveTexture ? 2 : 0) | (mat.normalTexture ? 1 : 0) | (mat.alphaBlend === true || (mat._alphaCutOff ?? 0) <= 0 && mat.alpha < 1 ? 64 : 0) | (mat.specGlossTexture ? 128 : 0) | (mat.doubleSided ? 256 : 0);
	if ((mat.occlusionStrength ?? 1) > 0) features |= PBR_HAS_OCCLUSION;
	if (mat.enableSpecularAA) features |= PBR_HAS_SPECULAR_AA;
	let features2 = 0;
	for (const ext of _getPbrExts().values()) if (ext.detect) {
		const d = ext.detect(mat);
		features |= d.f;
		features2 |= d.f2;
	}
	if (mat._uv2Mask) features2 |= PBR2_HAS_UV2;
	if (mat.baseColorFactor) features2 |= PBR2_HAS_BASE_COLOR_FACTOR;
	return {
		features,
		features2
	};
}
export { _computePbrMaterialFeatures };

//# sourceMappingURL=pbr-material-features.js.map