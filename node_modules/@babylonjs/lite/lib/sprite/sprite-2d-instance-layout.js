import { F32 } from "../engine/typed-arrays.js";
import { _markSprite2DDirty } from "./sprite-2d.js";
// src/sprite/sprite-2d-instance-layout.ts
/** @internal Append zeroed fields to every instance record; return their float offset. */
function _appendSprite2DInstanceData(layer, extraFloats) {
	const oldStride = layer._instanceFloatsPerSprite;
	const newStride = oldStride + extraFloats;
	const next = new F32(layer._capacity * newStride);
	for (let index = 0; index < layer.count; index++) {
		const oldBase = index * oldStride;
		const newBase = index * newStride;
		for (let component = 0; component < oldStride; component++) next[newBase + component] = layer._instanceData[oldBase + component];
	}
	layer._instanceData = next;
	layer._instanceFloatsPerSprite = newStride;
	layer._instanceStrideBytes = newStride * 4;
	_markSprite2DDirty(layer, 0, layer.count);
	return oldStride;
}
export { _appendSprite2DInstanceData };

//# sourceMappingURL=sprite-2d-instance-layout.js.map