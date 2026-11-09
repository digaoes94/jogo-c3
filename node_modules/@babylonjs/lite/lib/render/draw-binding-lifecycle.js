// src/render/draw-binding-lifecycle.ts
/** @internal Ordinary passes retain no optional resource-lifetime implementation. */
var drawBindingLifecycle = null;
/** @internal */
function installDrawBindingLifecycle(lifecycle) {
	drawBindingLifecycle = lifecycle;
}
export { drawBindingLifecycle, installDrawBindingLifecycle };

//# sourceMappingURL=draw-binding-lifecycle.js.map