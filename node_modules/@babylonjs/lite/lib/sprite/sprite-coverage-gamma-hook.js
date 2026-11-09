// src/sprite/sprite-coverage-gamma-hook.ts
var _coverageGammaHook = null;
/** @internal Register the sprite coverage-gamma hook. Idempotent; called by `setSprite2DCoverageGamma`. */
function _registerSpriteCoverageGammaHook(hook) {
	_coverageGammaHook = hook;
}
/** @internal The registered sprite coverage-gamma hook, or `null` when no gamma layer exists. */
function _getSpriteCoverageGammaHook() {
	return _coverageGammaHook;
}
export { _getSpriteCoverageGammaHook, _registerSpriteCoverageGammaHook };

//# sourceMappingURL=sprite-coverage-gamma-hook.js.map