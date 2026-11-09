import { isBillboardSpriteHandleAlive, removeBillboardSprite, setBillboardSpriteFrame } from "./billboard-sprite-handle.js";
import { playSpriteTargetAnimation } from "./sprite-animation.js";
// src/sprite/billboard-sprite-handle-animation.ts
/**
* Optional billboard stable-handle frame animation helper.
* Imports handle tracking only when callers opt into this entry point.
*/
/**
* Plays a frame animation on a billboard sprite addressed by its stable handle.
* The handle is resolved each tick, so the animation survives swap-remove reindexing.
* @param manager - Animation manager that drives the playback.
* @param handle - Stable handle of the billboard sprite to animate.
* @param from - First frame index of the range.
* @param to - Last frame index of the range.
* @param loop - When `true`, the animation restarts after reaching `to`.
* @param delayMs - Delay in milliseconds between frame steps.
* @param options - Optional end callback and removal behaviour.
* @returns The created sprite frame animation.
*/
function playBillboardSpriteAnimation(manager, handle, from, to, loop, delayMs, options) {
	return playSpriteTargetAnimation(manager, {
		setFrame(frame) {
			setBillboardSpriteFrame(handle, frame);
		},
		remove() {
			removeBillboardSprite(handle);
		},
		isAlive() {
			return isBillboardSpriteHandleAlive(handle);
		}
	}, from, to, loop, delayMs, options);
}
export { playBillboardSpriteAnimation };

//# sourceMappingURL=billboard-sprite-handle-animation.js.map