import { removeBillboardSpriteIndex, setBillboardSpriteFrameIndex } from "./billboard-sprite.js";
import { playSpriteTargetAnimation } from "./sprite-animation.js";
// src/sprite/billboard-sprite-index-animation.ts
/**
* Optional billboard raw-index frame animation helper.
* Keeps zero-handle slot animation separate from stable-handle tracking.
*/
/**
* Play a frame animation against a raw billboard sprite slot index.
*
* This is the zero-handle, slot-based path for structurally stable systems.
* If the slot is swap-removed externally, the animation follows whatever
* sprite later occupies the same index. Use `playBillboardSpriteAnimation`
* with a handle when animation must track a stable sprite identity across removals.
*/
function playBillboardSpriteIndexAnimation(manager, system, index, from, to, loop, delayMs, options) {
	return playSpriteTargetAnimation(manager, {
		setFrame(frame) {
			setBillboardSpriteFrameIndex(system, index, frame);
		},
		remove() {
			removeBillboardSpriteIndex(system, index);
		},
		isAlive() {
			return index >= 0 && index < system.count;
		}
	}, from, to, loop, delayMs, options);
}
export { playBillboardSpriteIndexAnimation };

//# sourceMappingURL=billboard-sprite-index-animation.js.map