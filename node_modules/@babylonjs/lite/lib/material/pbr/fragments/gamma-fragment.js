import { PBR_HAS_GAMMA_ALBEDO } from "../pbr-flag-bits.js";
import { gammaBaseColor } from "../pbr-template-gamma.js";
// src/material/pbr/fragments/gamma-fragment.ts
/** Gamma-albedo extension. Contributes only the `PBR_HAS_GAMMA_ALBEDO` feature bit (via
*  `detect`) plus the sRGB base-color decode template string (via {@link GammaTemplateHooks}).
*  No fragment slot / UBO field / binding of its own. */
var pbrExt = {
	id: "gamma-albedo",
	phase: "fragment",
	_gammaBaseColor: gammaBaseColor,
	detect(mat) {
		return {
			f: mat._gammaAlbedo ? PBR_HAS_GAMMA_ALBEDO : 0,
			f2: 0
		};
	}
};
export { pbrExt };

//# sourceMappingURL=gamma-fragment.js.map