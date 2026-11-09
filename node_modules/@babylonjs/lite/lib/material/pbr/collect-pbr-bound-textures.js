import { _getPbrExts } from "./pbr-flags.js";
// src/material/pbr/collect-pbr-bound-textures.ts
/** Collect all non-null textures referenced by a PBR material, including registered extensions. */
function collectPbrBoundTextures(mat) {
	const textures = [];
	for (const texture of [
		mat.baseColorTexture,
		mat.normalTexture,
		mat.ormTexture,
		mat.occlusionTexture,
		mat.emissiveTexture,
		mat.specGlossTexture
	]) if (texture) textures.push(texture);
	for (const extension of _getPbrExts().values()) extension.textures?.(mat, textures);
	return textures;
}
export { collectPbrBoundTextures };

//# sourceMappingURL=collect-pbr-bound-textures.js.map