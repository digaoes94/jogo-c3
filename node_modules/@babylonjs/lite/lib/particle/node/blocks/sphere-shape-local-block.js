import { randomRange } from "../../../math/random-range.js";
import { finishLocalPosition } from "../npe-local-position.js";
// src/particle/node/blocks/sphere-shape-local-block.ts
/** Local-space `SphereShapeBlock`; selected only for `SystemBlock.isLocal`. */
var sphereShapeLocalBlock = { build(block, ctx) {
	const state = ctx.state;
	const buffer = state.buffer;
	const system = state.system;
	const emitterWorldMatrix = state.emitterWorldMatrix;
	const emitter = state.emitter;
	const radiusGetter = ctx.input(block, "radius", () => 1);
	const radiusRangeGetter = ctx.input(block, "radiusRange", () => 1);
	const randomizerGetter = ctx.input(block, "directionRandomizer", () => 0);
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
	const explicit = ctx.isConnected(block, "direction1") && ctx.isConnected(block, "direction2");
	let birthX = 0;
	let birthY = 0;
	let birthZ = 0;
	const scratch = {
		x: 0,
		y: 0,
		z: 0
	};
	system.createPosition = (i) => {
		const radius = radiusGetter(i);
		const randomRadius = radius - randomRange(0, radius * radiusRangeGetter(i));
		const v = randomRange(0, 1);
		const phi = randomRange(0, 2 * Math.PI);
		const theta = Math.acos(2 * v - 1);
		birthX = randomRadius * Math.cos(phi) * Math.sin(theta);
		birthY = randomRadius * Math.cos(theta);
		birthZ = randomRadius * Math.sin(phi) * Math.sin(theta);
		if (block.serialized.isHemispheric === true) birthY = Math.abs(birthY);
		buffer.posX[i] = birthX;
		buffer.posY[i] = birthY;
		buffer.posZ[i] = birthZ;
		finishLocalPosition(system, buffer, i, emitterWorldMatrix, scratch);
		birthX = scratch.x;
		birthY = scratch.y;
		birthZ = scratch.z;
	};
	system.createDirection = (i) => {
		let x;
		let y;
		let z;
		if (explicit) {
			const direction1 = direction1Getter(i);
			const minX = direction1.x;
			const minY = direction1.y;
			const minZ = direction1.z;
			const direction2 = direction2Getter(i);
			x = randomRange(minX, direction2.x);
			y = randomRange(minY, direction2.y);
			z = randomRange(minZ, direction2.z);
		} else {
			x = birthX - emitter.x;
			y = birthY - emitter.y;
			z = birthZ - emitter.z;
			let length = Math.sqrt(x * x + y * y + z * z);
			if (length !== 0 && length !== 1) {
				x /= length;
				y /= length;
				z /= length;
			}
			const randomizer = randomizerGetter(i);
			x += randomRange(0, randomizer);
			y += randomRange(0, randomizer);
			z += randomRange(0, randomizer);
			length = Math.sqrt(x * x + y * y + z * z);
			if (length !== 0 && length !== 1) {
				x /= length;
				y /= length;
				z /= length;
			}
		}
		buffer.dirX[i] = x;
		buffer.dirY[i] = y;
		buffer.dirZ[i] = z;
	};
} };
export { sphereShapeLocalBlock };

//# sourceMappingURL=sphere-shape-local-block.js.map