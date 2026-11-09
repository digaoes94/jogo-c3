// src/sprite/sprite-fx-hook.ts
var _spriteFxHook = null;
var _billboardFxHook = null;
/** @internal Register the 2D-sprite custom-shader hook. Idempotent; called by `createSprite2DCustomShader`. */
function _registerSpriteFxHook(hook) {
	_spriteFxHook = hook;
}
/** @internal The registered 2D-sprite custom-shader hook, or `null` when no custom shader exists. */
function _getSpriteFxHook() {
	return _spriteFxHook;
}
/** @internal Register the billboard custom-shader hook. Idempotent; called by `createBillboardCustomShader`. */
function _registerBillboardFxHook(hook) {
	_billboardFxHook = hook;
}
/** @internal The registered billboard custom-shader hook, or `null` when no custom shader exists. */
function _getBillboardFxHook() {
	return _billboardFxHook;
}
export { _getBillboardFxHook, _getSpriteFxHook, _registerBillboardFxHook, _registerSpriteFxHook };

//# sourceMappingURL=sprite-fx-hook.js.map