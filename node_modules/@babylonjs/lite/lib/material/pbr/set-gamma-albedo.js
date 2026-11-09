import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/gamma-fragment.js";
// src/material/pbr/set-gamma-albedo.ts
/** Enable sRGB base-color decoding on `mat` (raises the albedo texture/factor to gamma 2.2
*  before lighting). Registers the gamma-albedo extension globally (idempotent). Call
*  before the scene is first built. */
function setPbrGammaAlbedo(mat) {
	mat._gammaAlbedo = true;
	_registerPbrExt(pbrExt);
}
export { setPbrGammaAlbedo };

//# sourceMappingURL=set-gamma-albedo.js.map