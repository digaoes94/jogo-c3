import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/sheen-fragment.js";
// src/material/pbr/set-sheen.ts
/** Add a soft velvet-like sheen layer (fabric, cloth) to `mat`. Registers the sheen
*  extension globally (idempotent). Call before the scene is first built. */
function setPbrSheen(mat, sheen) {
	mat._sheen = sheen;
	_registerPbrExt(pbrExt);
}
export { setPbrSheen };

//# sourceMappingURL=set-sheen.js.map