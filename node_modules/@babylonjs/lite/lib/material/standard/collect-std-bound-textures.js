import { _getStdExts } from "./standard-flags.js";
// src/material/standard/collect-std-bound-textures.ts
/** Collect all non-null textures referenced by a Standard material (for acquire/release). */
function collectStdBoundTextures(mat) {
	const t = [];
	if (mat.diffuseTexture) t.push(mat.diffuseTexture);
	for (const ext of _getStdExts().values()) ext._textures?.(mat, t);
	return t;
}
export { collectStdBoundTextures };

//# sourceMappingURL=collect-std-bound-textures.js.map