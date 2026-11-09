import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/anisotropy-fragment.js";
// src/material/pbr/set-anisotropy.ts
/** Add anisotropy (direction-dependent specular highlight stretching) to `mat`. Registers
*  the anisotropy extension globally (idempotent). Call before the scene is first built. */
function setPbrAnisotropy(mat, anisotropy) {
	mat._anisotropy = anisotropy;
	_registerPbrExt(pbrExt);
}
export { setPbrAnisotropy };

//# sourceMappingURL=set-anisotropy.js.map