import { isSprite2DHandleAlive, removeSprite2D, setSprite2DFrame } from "./sprite-2d-handle.js";
import { playSpriteTargetAnimation } from "./sprite-animation.js";
// src/sprite/sprite-2d-handle-animation.ts
/**
* Optional Sprite2D stable-handle frame animation helper.
* Imports handle tracking only when callers opt into this entry point.
*/
/**
* Plays a frame animation on a 2D sprite addressed by its stable handle.
* The handle is resolved each tick, so the animation survives swap-remove reindexing.
* @param manager - Animation manager that drives the playback.
* @param handle - Stable handle of the sprite to animate.
* @param from - First frame index of the range.
* @param to - Last frame index of the range.
* @param loop - When `true`, the animation restarts after reaching `to`.
* @param delayMs - Delay in milliseconds between frame steps.
* @param options - Optional end callback and removal behaviour.
* @returns The created sprite frame animation.
*/
function playSprite2DAnimation(manager, handle, from, to, loop, delayMs, options) {
	return playSpriteTargetAnimation(manager, {
		setFrame(frame) {
			setSprite2DFrame(handle, frame);
		},
		remove() {
			removeSprite2D(handle);
		},
		isAlive() {
			return isSprite2DHandleAlive(handle);
		}
	}, from, to, loop, delayMs, options);
}
export { playSprite2DAnimation };

//# sourceMappingURL=sprite-2d-handle-animation.js.map