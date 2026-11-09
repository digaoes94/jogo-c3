import { removeSprite2DIndex, setSprite2DFrameIndex } from "./sprite-2d.js";
import { playSpriteTargetAnimation } from "./sprite-animation.js";
// src/sprite/sprite-2d-index-animation.ts
/**
* Optional Sprite2D raw-index frame animation helper.
* Keeps zero-handle slot animation separate from stable-handle tracking.
*/
/**
* Play a frame animation against a raw Sprite2D slot index.
*
* This is the zero-handle, slot-based path for structurally stable layers.
* If the slot is swap-removed externally, the animation follows whatever
* sprite later occupies the same index. Use `playSprite2DAnimation` with a
* handle when animation must track a stable sprite identity across removals.
*/
function playSprite2DIndexAnimation(manager, layer, index, from, to, loop, delayMs, options) {
	return playSpriteTargetAnimation(manager, {
		setFrame(frame) {
			setSprite2DFrameIndex(layer, index, frame);
		},
		remove() {
			removeSprite2DIndex(layer, index);
		},
		isAlive() {
			return index >= 0 && index < layer.count;
		}
	}, from, to, loop, delayMs, options);
}
export { playSprite2DIndexAnimation };

//# sourceMappingURL=sprite-2d-index-animation.js.map