import { DIFFUSE_USES_UV2, DISABLE_LIGHTING, MATERIAL_ALPHA_BLEND, _getStdExts } from "./standard-flags.js";
// src/material/standard/standard-material-features.ts
/** @internal Compute material-only bits; registered extensions own optional feature detection. */
function _computeStandardMaterialFeatures(material) {
	let features = 0;
	if (material.diffuseTexture) {
		features |= 1;
		if (material.diffuseCoordIndex === 1) features |= DIFFUSE_USES_UV2;
	}
	if (!material.backFaceCulling) features |= 512;
	if (material.disableLighting) features |= DISABLE_LIGHTING;
	if (material.alpha < 1) features |= MATERIAL_ALPHA_BLEND;
	for (const extension of _getStdExts().values()) if (extension._detect) features |= extension._detect(material);
	return features;
}
export { _computeStandardMaterialFeatures };

//# sourceMappingURL=standard-material-features.js.map