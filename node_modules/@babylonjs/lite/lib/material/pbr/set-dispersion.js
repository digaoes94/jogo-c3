import { _registerPbrSceneHook } from "./pbr-flags.js";
import { _setDispersionSampleWgsl, registerPbrTransmission } from "./pbr-transmission-ext.js";
import { DISPERSION_SAMPLE_WGSL } from "./fragments/refraction-dispersion-wgsl.js";
// src/material/pbr/set-dispersion.ts
/** Add chromatic dispersion to `mat`'s refraction: the refracted ray is split into
*  per-RGB indices of refraction. `dispersion` is Babylon's empirical dispersion
*  strength (glTF's `KHR_materials_dispersion.dispersion` maps to `20 / dispersion`).
*  Requires transmission and volume — use with {@link setPbrTransmission} and a
*  `subsurface.thickness`. Call before the scene is first built. */
function setPbrDispersion(mat, dispersion) {
	((mat._subsurface ??= {}).refraction ??= {}).dispersion = dispersion;
	_setDispersionSampleWgsl(DISPERSION_SAMPLE_WGSL);
	_registerPbrSceneHook(registerPbrTransmission);
}
export { setPbrDispersion };

//# sourceMappingURL=set-dispersion.js.map