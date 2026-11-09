import { transformCoordinatesToRef } from "../../math/mat4-transform.js";
// src/particle/node/npe-local-position.ts
/** Finish a local shape's position slot: seed optional local columns, then write the world render position. */
function finishLocalPosition(system, buffer, i, emitterWorldMatrix, scratch) {
	system._seedLocalPosition?.(i);
	transformCoordinatesToRef(buffer.posX[i], buffer.posY[i], buffer.posZ[i], emitterWorldMatrix, scratch);
	buffer.posX[i] = scratch.x;
	buffer.posY[i] = scratch.y;
	buffer.posZ[i] = scratch.z;
}
export { finishLocalPosition };

//# sourceMappingURL=npe-local-position.js.map