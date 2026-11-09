import { randomRange } from "../../../math/random-range.js";
import { finishLocalPosition } from "../npe-local-position.js";
// src/particle/node/blocks/box-shape-local-block.ts
/** Emitter-local `BoxShapeBlock`. */
var boxShapeLocalBlock = { build(block, ctx) {
	const system = ctx.state.system;
	const buffer = ctx.state.buffer;
	const emitterWorldMatrix = ctx.state.emitterWorldMatrix;
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
	const minBoxGetter = ctx.input(block, "minEmitBox", () => ({
		x: -.5,
		y: -.5,
		z: -.5
	}));
	const maxBoxGetter = ctx.input(block, "maxEmitBox", () => ({
		x: .5,
		y: .5,
		z: .5
	}));
	const scratch = {
		x: 0,
		y: 0,
		z: 0
	};
	system.createPosition = (i) => {
		const min = minBoxGetter(i);
		const minX = min.x;
		const minY = min.y;
		const minZ = min.z;
		const max = maxBoxGetter(i);
		buffer.posX[i] = randomRange(minX, max.x);
		buffer.posY[i] = randomRange(minY, max.y);
		buffer.posZ[i] = randomRange(minZ, max.z);
		finishLocalPosition(system, buffer, i, emitterWorldMatrix, scratch);
	};
	system.createDirection = (i) => {
		const direction1 = direction1Getter(i);
		const minX = direction1.x;
		const minY = direction1.y;
		const minZ = direction1.z;
		const direction2 = direction2Getter(i);
		buffer.dirX[i] = randomRange(minX, direction2.x);
		buffer.dirY[i] = randomRange(minY, direction2.y);
		buffer.dirZ[i] = randomRange(minZ, direction2.z);
	};
} };
export { boxShapeLocalBlock };

//# sourceMappingURL=box-shape-local-block.js.map