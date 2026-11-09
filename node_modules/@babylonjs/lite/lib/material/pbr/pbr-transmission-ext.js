import { _registerPbrExt } from "./pbr-flags.js";
import { _t, enableSceneTransmission } from "../../frame-graph/transmission.js";
import { makeRefractionRttExt } from "./fragments/refraction-rtt-fragment.js";
// src/material/pbr/pbr-transmission-ext.ts
var _dispersionSampleWgsl;
/** @internal Supply the per-RGB chromatic-dispersion sample WGSL. Called by
*  `setPbrDispersion` so the 3-ray code chunk is bundled solely by dispersion scenes
*  and never weighs on other transmission scenes. The string is read when
*  `registerPbrTransmission` builds the refraction ext, so — per the documented
*  contract on `setPbrDispersion` — it must be set before the first build. */
function _setDispersionSampleWgsl(wgsl) {
	_dispersionSampleWgsl = wgsl;
}
/** @internal `PbrSceneHook` that enables scene-texture transmission and registers the
*  refraction ext. The hook registry is per-runtime, so this re-checks `meshes` and
*  no-ops for groups without a transmissive surface — otherwise opting one material in
*  would retarget every other group's render task for nothing. */
function registerPbrTransmission(scene, engine, meshes) {
	let hasTransmissionRefraction = false;
	for (let i = 0; i < meshes.length && !hasTransmissionRefraction; i++) {
		const mat = meshes[i].material;
		hasTransmissionRefraction = !!mat?._transmissive && (mat._subsurface?.refraction?.intensity ?? 0) > 0;
	}
	if (!hasTransmissionRefraction) return;
	scene._p?.(_t(scene, engine)) || enableSceneTransmission(scene, engine);
	_registerPbrExt(makeRefractionRttExt(_dispersionSampleWgsl));
}
export { _setDispersionSampleWgsl, registerPbrTransmission };

//# sourceMappingURL=pbr-transmission-ext.js.map