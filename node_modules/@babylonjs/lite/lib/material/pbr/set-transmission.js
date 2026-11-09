import { _registerPbrSceneHook } from "./pbr-flags.js";
import { registerPbrTransmission } from "./pbr-transmission-ext.js";
// src/material/pbr/set-transmission.ts
/** Make `mat` a transmissive (refractive) surface: the renderer grabs the opaque scene
*  colour mid-pass and the material refracts it, per `KHR_materials_transmission` +
*  `_volume` + `_ior`. Registers the scene-level transmission hook globally (idempotent),
*  which enables scene-texture transmission on every render task of any scene that
*  actually contains a transmissive mesh. Call before the scene is first built.
*
*  Refraction only engages when `refraction.intensity > 0`. Pair with
*  {@link setPbrSubsurface} for thickness/tint (volume absorption) and
*  `setPbrDispersion` for chromatic dispersion. */
function setPbrTransmission(mat, refraction) {
	mat._transmissive = true;
	(mat._subsurface ??= {}).refraction = refraction;
	_registerPbrSceneHook(registerPbrTransmission);
}
export { setPbrTransmission };

//# sourceMappingURL=set-transmission.js.map