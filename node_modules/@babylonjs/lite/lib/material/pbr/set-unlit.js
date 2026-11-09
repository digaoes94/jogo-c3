import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/unlit-fragment.js";
// src/material/pbr/set-unlit.ts
/** Make `mat` unlit: the base color is output directly, bypassing all lighting, IBL,
*  and tonemap (matches `KHR_materials_unlit`). Optional `unlitColor` is a linear-RGB tint
*  applied to the base color. Registers the unlit extension globally (idempotent). Call
*  before the scene is first built. */
function setPbrUnlit(mat, unlitColor) {
	mat._unlit = true;
	if (unlitColor) mat._unlitColor = unlitColor;
	_registerPbrExt(pbrExt);
}
export { setPbrUnlit };

//# sourceMappingURL=set-unlit.js.map