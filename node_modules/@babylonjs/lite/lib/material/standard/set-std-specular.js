import { _registerStdExt } from "./standard-flags.js";
import { stdSpecularExt } from "./fragments/std-specular-fragment.js";
// src/material/standard/set-std-specular.ts
/** Set the specular texture on `mat`. Replaces `mat.specularColor`, and its alpha
*  channel modulates glossiness. Reads `mat.specularCoordIndex` to select UV1 (0) or
*  UV2 (1). Registers the specular extension globally (idempotent). Call before the
*  scene is first built. */
function setStandardSpecularTexture(mat, texture) {
	mat._specularTexture = texture;
	_registerStdExt(stdSpecularExt);
}
export { setStandardSpecularTexture };

//# sourceMappingURL=set-std-specular.js.map