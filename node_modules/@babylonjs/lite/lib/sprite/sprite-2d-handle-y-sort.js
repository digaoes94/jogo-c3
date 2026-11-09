import { getSprite2DHandleIndex } from "./sprite-2d-handle.js";
import { setSprite2DYSortBias } from "./sprite-2d-y-sort.js";
// src/sprite/sprite-2d-handle-y-sort.ts
/**
* Set the Y-sort bias for the sprite referenced by a stable handle.
* @param handle - Live Sprite2D handle whose current logical slot is resolved automatically.
* @param bias - Finite value added to the sprite's `positionPx.y` for ordering only.
*/
function setSprite2DYSortHandleBias(handle, bias) {
	setSprite2DYSortBias(handle.layer, getSprite2DHandleIndex(handle), bias);
}
export { setSprite2DYSortHandleBias };

//# sourceMappingURL=sprite-2d-handle-y-sort.js.map