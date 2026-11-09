import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/emissive-fragment.js";
// src/material/pbr/set-emissive.ts
/** Set the linear-RGB emissive color on `mat` (values may exceed 1.0 for HDR emissive,
*  e.g. `KHR_materials_emissive_strength`). If the material also has an
*  `emissiveTexture`, this color multiplies the sampled texel. The array is stored by
*  reference and re-read on every UBO write, so animating it in place (index writes)
*  needs no further calls. Registers the emissive extension globally (idempotent).
*  Call before the scene is first built. */
function setPbrEmissive(mat, color) {
	mat._emissiveColor = color;
	_registerPbrExt(pbrExt);
}
export { setPbrEmissive };

//# sourceMappingURL=set-emissive.js.map