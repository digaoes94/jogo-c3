import { _registerStdExt } from "./standard-flags.js";
import { stdReflectionExt } from "./fragments/std-reflection-fragment.js";
// src/material/standard/set-std-reflection.ts
/** Set the 2D spherical reflection texture on `mat`. Reads `mat.reflectionLevel` for
*  intensity and `mat.reflectionCoordMode` (1 = spherical, 2 = planar). Registers the
*  reflection extension globally (idempotent). Call before the scene is first built. */
function setStandardReflectionTexture(mat, texture) {
	mat._reflectionTexture = texture;
	_registerStdExt(stdReflectionExt);
}
export { setStandardReflectionTexture };

//# sourceMappingURL=set-std-reflection.js.map