import { PBR_HAS_SKYBOX } from "../pbr-flag-bits.js";
import { IBL_SKYBOX_CALCULATION } from "./ibl-skybox-wgsl.js";
// src/material/pbr/fragments/skybox-fragment.ts
/** Skybox extension. Contributes only the `PBR_HAS_SKYBOX` feature bit (via `detect`) plus
*  the skybox IBL-sampling WGSL (via {@link SkyboxTemplateHooks}). The IBL fragment does the
*  actual weaving; this ext has no fragment slot / UBO field / binding of its own. */
var pbrExt = {
	id: "skybox",
	phase: "fragment",
	_skyboxCalc: IBL_SKYBOX_CALCULATION,
	detect(mat) {
		return {
			f: mat._skyboxMode ? PBR_HAS_SKYBOX : 0,
			f2: 0
		};
	}
};
export { pbrExt };

//# sourceMappingURL=skybox-fragment.js.map