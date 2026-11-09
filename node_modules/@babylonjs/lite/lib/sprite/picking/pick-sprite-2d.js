import { _getSprite2DYSortHook } from "../sprite-2d.js";
// src/sprite/picking/pick-sprite-2d.ts
var POS_X = 0;
var POS_Y = 1;
var SIZE_X = 2;
var SIZE_Y = 3;
var ROTATION = 8;
/**
* Hit-test a point against the sprites of one or more `Sprite2DLayer`s and return the topmost
* sprite under it, or `null` for a miss.
*
* `xPx` / `yPx` are in the layers' **local** coordinate space — the same space as each sprite's
* `positionPx`. For a layer rendered 1:1 to the canvas (identity `view`) that is simply the
* backing-store pixel under the pointer (`(clientX - rect.left) * devicePixelRatio`). For a
* panned / zoomed / rotated layer, map the pointer into layer space first via the inverse of
* `layer.view` (the caller owns that transform). All `layers` are assumed to share one space.
*
* Layers are tested in reverse array order (later layers are drawn on top, so they win). Within
* an ordinary layer, sprites are tested in reverse canonical logical order (normally reverse
* insertion order), matching its GPU upload. Within an enabled Y-sort layer, sprites are tested
* from topmost to bottommost through the current stable draw permutation. Layers with
* `visible: false` and hidden sprites (`visible: false`, stored as a zero-size quad) are skipped,
* exactly as the renderer skips them.
*
* @param layers - Sprite layers to test, in draw order (e.g. `spriteRenderer.layers`).
* @param xPx - Query X in layer-local pixels.
* @param yPx - Query Y in layer-local pixels.
* @returns The topmost hit, or `null` if the point is over no sprite.
*/
function pickSprite2D(layers, xPx, yPx) {
	for (let li = layers.length - 1; li >= 0; li--) {
		const layer = layers[li];
		if (!layer.visible) continue;
		const data = layer._instanceData;
		const stride = layer._instanceFloatsPerSprite;
		const pivotX = layer.pivot[0];
		const pivotY = layer.pivot[1];
		const drawOrder = _getSprite2DYSortHook()?.drawOrder(layer);
		for (let drawIndex = layer.count - 1; drawIndex >= 0; drawIndex--) {
			const i = drawOrder ? drawOrder[drawIndex] : drawIndex;
			const base = i * stride;
			const sizeX = data[base + SIZE_X];
			const sizeY = data[base + SIZE_Y];
			if (sizeX <= 0 || sizeY <= 0) continue;
			const dx = xPx - data[base + POS_X];
			const dy = yPx - data[base + POS_Y];
			const rotation = data[base + ROTATION];
			const cos = Math.cos(rotation);
			const sin = Math.sin(rotation);
			const localX = dx * cos + dy * sin;
			const localY = -dx * sin + dy * cos;
			const u = localX / sizeX + pivotX;
			const v = localY / sizeY + pivotY;
			if (u >= 0 && u <= 1 && v >= 0 && v <= 1) return {
				layer,
				spriteIndex: i,
				u,
				v
			};
		}
	}
	return null;
}
export { pickSprite2D };

//# sourceMappingURL=pick-sprite-2d.js.map