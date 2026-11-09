import { getMaterialSource } from "../material-view.js";
// src/material/pbr/pbr-local-cubemap-state.ts
var _states = null;
/** @internal */
function _getPbrLocalEnvironment(material) {
	return material && typeof material === "object" ? _states?.get(getMaterialSource(material)) : void 0;
}
/** @internal */
function _setPbrLocalEnvironment(material, state) {
	if (state) (_states ??= /* @__PURE__ */ new WeakMap()).set(material, state);
	else _states?.delete(material);
	material._renderFeatures = void 0;
}
export { _getPbrLocalEnvironment, _setPbrLocalEnvironment };

//# sourceMappingURL=pbr-local-cubemap-state.js.map