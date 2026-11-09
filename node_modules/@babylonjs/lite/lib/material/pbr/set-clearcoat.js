import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/clearcoat-fragment.js";
// src/material/pbr/set-clearcoat.ts
/** Add a glossy transparent clearcoat top layer (car paint, lacquer) to `mat`.
*  Registers the clearcoat extension globally (idempotent) so the renderer detects and
*  renders it. Call on the material returned by `createPbrMaterial` (or on the props
*  before creating it), before the scene is first built. */
function setPbrClearCoat(mat, clearCoat) {
	mat._clearCoat = clearCoat;
	_registerPbrExt(pbrExt);
}
export { setPbrClearCoat };

//# sourceMappingURL=set-clearcoat.js.map