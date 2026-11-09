import { _releaseDeviceLostRecoveryCapture, _retainDeviceLostRecoveryCapture } from "./device-lost-recovery-capture.js";
import { _enableDeviceLostRecovery } from "./device-lost-recovery.js";
// src/engine/device-lost-sprite-recovery.ts
/**
* Enable best-effort WebGPU device-lost recovery for every registered SpriteRenderer.
*
* Enable this before creating or loading sprite textures so their recovery
* sources are retained. Device reacquisition remains shared with every other
* enabled rendering-context recovery adapter on the engine, and every kind that
* is registered at loss time needs one — recovery fails rather than leave a
* rendering context bound to the lost device.
*/
function enableDeviceLostSpriteRecovery(engine, options = {}) {
	return _enableDeviceLostRecovery(engine, {
		_kind: "sprite-renderer",
		_enable: _retainDeviceLostRecoveryCapture,
		_disable: _releaseDeviceLostRecoveryCapture,
		async _recover(currentEngine) {
			const { rebuildRegisteredSpriteRenderers } = await import("../sprite/sprite-recovery.js");
			await rebuildRegisteredSpriteRenderers(currentEngine);
		},
		_onLost: options.onLost,
		_onRecovered: options.onRecovered,
		_onRecoveryFailed: options.onRecoveryFailed
	});
}
export { enableDeviceLostSpriteRecovery };

//# sourceMappingURL=device-lost-sprite-recovery.js.map