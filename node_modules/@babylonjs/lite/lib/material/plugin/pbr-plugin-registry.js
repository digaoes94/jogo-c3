import { pbrPluginDecorator } from "./pbr-plugin-decorator.js";
// src/material/plugin/pbr-plugin-registry.ts
var indexToFragment = null;
var counter = 0;
var activeExtension;
/** @internal Allocate a stable, collision-free identity shared by all PBR plugin bridges. */
function _allocatePbrPluginIndex() {
	return ++counter;
}
/** @internal Store a fragment under its allocated cross-bridge identity. */
function _registerPbrPluginFragment(index, fragment) {
	(indexToFragment ??= [])[index] = fragment;
}
/** @internal Resolve fragments created by either PBR plugin bridge. */
function _getPbrPluginFragment(index) {
	return indexToFragment?.[index];
}
/** @internal Preserve an opt-in PBR plugin bridge across later registration and reconciliation. */
function _setActivePbrPluginExt(extension) {
	activeExtension = pbrPluginDecorator ? pbrPluginDecorator(extension) : extension;
}
/** @internal Return the active opt-in bridge, or the ordinary bridge before an override is installed. */
function _getActivePbrPluginExt(fallback) {
	return activeExtension ?? fallback;
}
export { _allocatePbrPluginIndex, _getActivePbrPluginExt, _getPbrPluginFragment, _registerPbrPluginFragment, _setActivePbrPluginExt };

//# sourceMappingURL=pbr-plugin-registry.js.map