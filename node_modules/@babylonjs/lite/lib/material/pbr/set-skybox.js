import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/skybox-fragment.js";
// src/material/pbr/set-skybox.ts
/** Turn `mat` into a skybox material that samples the scene IBL cubemap along the view
*  direction (use on a large camera-centred box). Registers the skybox extension globally
*  (idempotent). Requires the scene to have an environment (IBL). Call before the scene is
*  first built. */
function setPbrSkybox(mat) {
	mat._skyboxMode = true;
	_registerPbrExt(pbrExt);
}
export { setPbrSkybox };

//# sourceMappingURL=set-skybox.js.map