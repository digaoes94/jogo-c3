import { _installPbrBindingContext } from "../pbr-pipeline.js";
import { bindAreaLightLtc } from "../../../light/area-light-ltc.js";
import { bindAreaLightEmission } from "../../../light/area-light-emission.js";
import { areaLightBindings } from "../../../light/area-light-wgsl.js";
import { areaLightEmissionBindings, areaLightEmissionWgsl } from "../../../light/area-light-emission-wgsl.js";
import { rectAreaMultiLightSource, rectAreaPbrExt, rectAreaSingleLightSource } from "./rect-area-light-fragment.js";
// src/material/pbr/fragments/rect-area-light-emission-fragment.ts
/** @internal Reserved scene bit, owned by this lazy extension only. */
var RECT_AREA_PBR_EMISSION = 256;
var EVALUATION = "evaluateAreaLtc(N,V,input.worldPos,areaEntry,roughness,lightIndex)";
var _installed = false;
/** @internal Only the lazy feature populates its scene-owned binding context. */
function installRectAreaEmissionPbr() {
	if (_installed) return;
	_installPbrBindingContext((context, id, disposers) => {
		context._lightingId = id;
		context._disposers = disposers;
	});
	_installed = true;
}
/** @internal */
function rectAreaEmissionSingle(type) {
	return rectAreaSingleLightSource(type, EVALUATION);
}
/** @internal */
function rectAreaEmissionMulti() {
	return rectAreaMultiLightSource(EVALUATION);
}
/** @internal Textured variants retain the original restriction checks, not broader restrictions. */
var rectAreaEmissionPbrExt = {
	id: "rect-area-emission",
	phase: "fragment",
	frag(ctx) {
		if (!((ctx._sceneFeatures ?? 0) & 256)) return null;
		return rectAreaPbrExt.frag({
			...ctx,
			_sceneFeatures: (ctx._sceneFeatures ?? 0) & -257
		}) ? {
			_id: "rect-area-emission",
			_bindings: [...areaLightBindings(), ...areaLightEmissionBindings()],
			_helperFunctions: areaLightEmissionWgsl()
		} : null;
	},
	bind(ctx, entries, binding) {
		binding = bindAreaLightLtc(ctx._engine, entries, binding);
		return bindAreaLightEmission(ctx._lightingId, ctx._engine._device, entries, binding, ctx._disposers);
	}
};
export { RECT_AREA_PBR_EMISSION, installRectAreaEmissionPbr, rectAreaEmissionMulti, rectAreaEmissionPbrExt, rectAreaEmissionSingle };

//# sourceMappingURL=rect-area-light-emission-fragment.js.map