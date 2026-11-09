import { _registerStdExt } from "./standard-flags.js";
import { stdAmbientExt } from "./fragments/std-ambient-fragment.js";
// src/material/standard/set-std-ambient.ts
/** Set the ambient/occlusion texture on `mat`, which multiplies the final diffuse
*  contribution. Reads `mat.ambientTexLevel` for intensity and `mat.ambientCoordIndex`
*  to select UV1 (0) or UV2 (1). Registers the ambient extension globally (idempotent).
*  Call before the scene is first built. */
function setStandardAmbientTexture(mat, texture) {
	mat._ambientTexture = texture;
	_registerStdExt(stdAmbientExt);
}
export { setStandardAmbientTexture };

//# sourceMappingURL=set-std-ambient.js.map