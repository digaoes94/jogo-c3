import { transformCoordinatesToRef, transformNormalToRef } from "../../../math/mat4-transform.js";
import { randomRange } from "../../../math/random-range.js";
// src/particle/node/blocks/cone-shape-block.ts
/** `ConeShapeBlock` — cone sampling with directed or radial emission. */
var coneShapeBlock = { build(block, ctx) {
	const state = ctx.state;
	const system = state.system;
	const buffer = state.buffer;
	const emitterWorldMatrix = state.emitterWorldMatrix;
	const emitter = state.emitter;
	const emitFromSpawnPointOnly = block.serialized.emitFromSpawnPointOnly === true;
	const radiusGetter = ctx.input(block, "radius", () => 1);
	const angleGetter = ctx.input(block, "angle", () => Math.PI);
	const radiusRangeGetter = ctx.input(block, "radiusRange", () => 1);
	const heightRangeGetter = ctx.input(block, "heightRange", () => 1);
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
	const scratch = {
		x: 0,
		y: 0,
		z: 0
	};
	let birthX = 0;
	let birthY = 0;
	let birthZ = 0;
	system.createPosition = (i) => {
		const radius = radiusGetter(i);
		const coneAngle = angleGetter(i);
		const radiusRange = radiusRangeGetter(i);
		const heightRange = heightRangeGetter(i);
		let heightFactor;
		if (emitFromSpawnPointOnly) heightFactor = 1e-4;
		else {
			heightFactor = randomRange(0, heightRange);
			heightFactor = 1 - heightFactor * heightFactor;
		}
		const sampleRadius = (radius - randomRange(0, radius * radiusRange)) * heightFactor;
		const azimuth = randomRange(0, Math.PI * 2);
		const localX = sampleRadius * Math.sin(azimuth);
		const localZ = sampleRadius * Math.cos(azimuth);
		const localY = heightFactor * (coneAngle !== 0 ? radius / Math.tan(coneAngle / 2) : 1);
		transformCoordinatesToRef(localX, localY, localZ, emitterWorldMatrix, scratch);
		birthX = scratch.x;
		birthY = scratch.y;
		birthZ = scratch.z;
		buffer.posX[i] = birthX;
		buffer.posY[i] = birthY;
		buffer.posZ[i] = birthZ;
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
		transformNormalToRef(x, y, z, emitterWorldMatrix, scratch);
		buffer.dirX[i] = scratch.x;
		buffer.dirY[i] = scratch.y;
		buffer.dirZ[i] = scratch.z;
	};
} };
export { coneShapeBlock };

//# sourceMappingURL=cone-shape-block.js.map