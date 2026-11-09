import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/subsurface-fragment.js";
// src/material/pbr/set-subsurface.ts
/** Add subsurface translucency (thin-surface diffuse transmission) to `mat`. The
*  fragment only renders when `subsurface.translucency` is present. Registers the
*  subsurface extension globally (idempotent). Call before the scene is first built. */
function setPbrSubsurface(mat, subsurface) {
	mat._subsurface = subsurface;
	_registerPbrExt(pbrExt);
}
export { setPbrSubsurface };

//# sourceMappingURL=set-subsurface.js.map