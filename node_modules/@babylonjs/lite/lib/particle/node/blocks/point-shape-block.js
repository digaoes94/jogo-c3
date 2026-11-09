import { transformCoordinatesToRef, transformNormalToRef } from "../../../math/mat4-transform.js";
import { randomRange } from "../../../math/random-range.js";
// src/particle/node/blocks/point-shape-block.ts
/** `PointShapeBlock` — emit at the origin with a random direction range. */
var pointShapeBlock = { build(block, ctx) {
	const state = ctx.state;
	const system = state.system;
	const buffer = state.buffer;
	const emitterWorldMatrix = state.emitterWorldMatrix;
	const direction1Getter = ctx.input(block, "direction1", () => ({
		x: 0,
		y: 1,
		z: 0
	}));
	const direction2Getter = ctx.input(block, "direction2", () => ({
		x: 0,
		y: 1,
		z: 0
	}));
	const scratch = {
		x: 0,
		y: 0,
		z: 0
	};
	system.createPosition = (i) => {
		transformCoordinatesToRef(0, 0, 0, emitterWorldMatrix, scratch);
		buffer.posX[i] = scratch.x;
		buffer.posY[i] = scratch.y;
		buffer.posZ[i] = scratch.z;
	};
	system.createDirection = (i) => {
		const direction1 = direction1Getter(i);
		const minX = direction1.x;
		const minY = direction1.y;
		const minZ = direction1.z;
		const direction2 = direction2Getter(i);
		const x = randomRange(minX, direction2.x);
		const y = randomRange(minY, direction2.y);
		const z = randomRange(minZ, direction2.z);
		transformNormalToRef(x, y, z, emitterWorldMatrix, scratch);
		buffer.dirX[i] = scratch.x;
		buffer.dirY[i] = scratch.y;
		buffer.dirZ[i] = scratch.z;
	};
} };
export { pointShapeBlock };

//# sourceMappingURL=point-shape-block.js.map