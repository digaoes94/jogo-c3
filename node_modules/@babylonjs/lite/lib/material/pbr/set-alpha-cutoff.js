import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/alpha-test-fragment.js";
// src/material/pbr/set-alpha-cutoff.ts
/** Enable alpha testing on `mat`: fragments whose base-color alpha (× material alpha) is
*  below `alphaCutOff` are discarded. Registers the alpha-test extension globally
*  (idempotent). Call before the scene is first built. */
function setPbrAlphaCutoff(mat, alphaCutOff) {
	mat._alphaCutOff = alphaCutOff;
	_registerPbrExt(pbrExt);
}
export { setPbrAlphaCutoff };

//# sourceMappingURL=set-alpha-cutoff.js.map