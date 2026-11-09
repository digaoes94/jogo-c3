import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/iridescence-fragment.js";
// src/material/pbr/set-iridescence.ts
/** Add a thin-film iridescence layer (soap-bubble / oil-slick hue shift) to `mat`.
*  Registers the iridescence extension globally (idempotent). Call before the scene is
*  first built. */
function setPbrIridescence(mat, iridescence) {
	mat._iridescence = iridescence;
	_registerPbrExt(pbrExt);
}
export { setPbrIridescence };

//# sourceMappingURL=set-iridescence.js.map