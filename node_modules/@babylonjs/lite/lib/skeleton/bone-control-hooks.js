// src/skeleton/bone-control-hooks.ts
/** @internal */
var _boneBuilder = null;
/** @internal */
var _boneApplier = null;
var _loadBoneControlForSkinnedAssets = false;
var _boneControlLoad = null;
/** Opt in to loading bone control only when a glTF skin is encountered. */
function enableBoneControlForSkinnedAssets() {
	_loadBoneControlForSkinnedAssets = true;
}
/** @internal Install bone control on demand from the skin-gated loader feature. */
async function _ensureBoneControlForSkinnedAsset() {
	if (!_loadBoneControlForSkinnedAssets || _boneBuilder) return;
	_boneControlLoad ??= import("./bone-control.js").then(({ enableBoneControl }) => enableBoneControl());
	await _boneControlLoad;
}
/** @internal Install the bone-control implementation. Called by `enableBoneControl`. */
function _installBoneControl(builder, applier) {
	_boneBuilder = builder;
	_boneApplier = applier;
}
export { _boneApplier, _boneBuilder, _ensureBoneControlForSkinnedAsset, _installBoneControl, enableBoneControlForSkinnedAssets };

//# sourceMappingURL=bone-control-hooks.js.map