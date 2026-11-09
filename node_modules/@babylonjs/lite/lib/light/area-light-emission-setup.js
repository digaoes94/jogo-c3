import { _registerPbrExt } from "../material/pbr/pbr-flags.js";
import { _registerStdExt } from "../material/standard/standard-flags.js";
import { clearAreaLightEmission, prepareAreaLightEmission } from "./area-light-emission.js";
import { installRectAreaEmissionPbr, rectAreaEmissionMulti, rectAreaEmissionPbrExt, rectAreaEmissionSingle } from "../material/pbr/fragments/rect-area-light-emission-fragment.js";
import { installRectAreaEmissionStandard, rectAreaEmissionStandardContext, rectAreaEmissionStdExt } from "../material/standard/fragments/rect-area-light-emission-fragment.js";
// src/light/area-light-emission-setup.ts
/** @internal Loaded only when a processed emission image is actually assigned to a packed light. */
async function prepareRectAreaEmission(scene, lighting) {
	const id = await prepareAreaLightEmission(scene);
	if (id === void 0) return;
	_registerPbrExt(rectAreaEmissionPbrExt);
	installRectAreaEmissionPbr();
	_registerStdExt(rectAreaEmissionStdExt);
	installRectAreaEmissionStandard();
	const features = lighting._pbrFeatures;
	lighting._bindingId = id;
	lighting._single = rectAreaEmissionSingle;
	lighting._multi = rectAreaEmissionMulti;
	lighting._pbrFeatures = (mesh) => (features?.(mesh) ?? 0) | 256;
	lighting._standard = rectAreaEmissionStandardContext;
}
export { clearAreaLightEmission, prepareRectAreaEmission };

//# sourceMappingURL=area-light-emission-setup.js.map