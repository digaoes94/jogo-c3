// src/loader-gltf/gltf-feature-hooks.ts
var _enabled;
/** @internal Register an explicitly enabled glTF feature without adding its semantics to the core loader. */
function _registerEnabledGltfFeature(gate, feature) {
	const previous = _enabled;
	_enabled = (json, features) => {
		previous?.(json, features);
		gate(json) && features.push(feature);
	};
}
/** @internal Append enabled features after the registry's content-triggered features resolve. */
function _appendEnabledGltfFeatures(json, features) {
	_enabled?.(json, features);
}
export { _appendEnabledGltfFeatures, _registerEnabledGltfFeature };

//# sourceMappingURL=gltf-feature-hooks.js.map