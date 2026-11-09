import { _registerStdExt } from "./standard-flags.js";
import { bumpStdExt } from "./fragments/normal-map-fragment.js";
// src/material/standard/set-std-bump.ts
/** Set the bump/normal-map texture on `mat`. Uses a cotangent frame, so the mesh needs
*  no tangent attribute. Perturbation strength is controlled by `mat.bumpLevel`
*  (default 1.0). Registers the normal-map extension globally (idempotent). Call before
*  the scene is first built. */
function setStandardBumpTexture(mat, texture) {
	mat._bumpTexture = texture;
	_registerStdExt(bumpStdExt);
}
export { setStandardBumpTexture };

//# sourceMappingURL=set-std-bump.js.map