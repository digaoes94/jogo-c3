import { _registerStdExt } from "./standard-flags.js";
import { stdOpacityExt } from "./fragments/std-opacity-fragment.js";
// src/material/standard/set-std-opacity.ts
/** Set the opacity texture on `mat`, which multiplies alpha. Reads `mat.opacityLevel`
*  for intensity and `mat.opacityFromRGB` to derive opacity from RGB luminance instead
*  of the `.a` channel. Registers the opacity extension globally (idempotent). Call
*  before the scene is first built. */
function setStandardOpacityTexture(mat, texture) {
	mat._opacityTexture = texture;
	_registerStdExt(stdOpacityExt);
}
export { setStandardOpacityTexture };

//# sourceMappingURL=set-std-opacity.js.map