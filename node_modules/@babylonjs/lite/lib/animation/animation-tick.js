// src/animation/animation-tick.ts
var _tickAnimationImpl = null;
/** @internal Register the real tick implementation. Called by the animation group factories. */
function _setTickAnimationImpl(impl) {
	_tickAnimationImpl = impl;
}
/** @internal Advance animation by deltaMs. Forwards to the implementation registered when the
*  first animation group was created; a no-op before any group exists. */
function tickAnimation(group, deltaMs, engine) {
	_tickAnimationImpl?.(group, deltaMs, engine);
}
export { _setTickAnimationImpl, tickAnimation };

//# sourceMappingURL=animation-tick.js.map