import { transformCoordinatesToRef, transformNormalToRef } from "../../../math/mat4-transform.js";
import { randomRange } from "../../../math/random-range.js";
// src/particle/node/blocks/sphere-shape-block.ts
/**
* `SphereShapeBlock` — emits inside a sphere (or hemisphere) and points particles radially outward,
* with optional direction jitter. When both direction inputs are connected it uses their explicit random
* range instead. Random draws and transforms match Babylon.js; state is written directly into
* columns and the per-spawn scratch is reused.
*/
var sphereShapeBlock = { build(block, ctx) {
	const state = ctx.state;
	const system = state.system;
	const buffer = state.buffer;
	const isHemispheric = block.serialized.isHemispheric === true;
	const radiusGetter = ctx.input(block, "radius", () => 1);
	const radiusRangeGetter = ctx.input(block, "radiusRange", () => 1);
	const directionRandomizerGetter = ctx.input(block, "directionRandomizer", () => 0);
	const dir1Getter = ctx.input(block, "direction1", () => ({
		x: 0,
		y: 1,
		z: 0
	}));
	const dir2Getter = ctx.input(block, "direction2", () => ({
		x: 0,
		y: 1,
		z: 0
	}));
	const useExplicitDirections = ctx.isConnected(block, "direction1") && ctx.isConnected(block, "direction2");
	const emitterWorldMatrix = state.emitterWorldMatrix;
	const emitter = state.emitter;
	const posX = buffer.posX;
	const posY = buffer.posY;
	const posZ = buffer.posZ;
	const dirX = buffer.dirX;
	const dirY = buffer.dirY;
	const dirZ = buffer.dirZ;
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
		const radiusRange = radiusRangeGetter(i);
		const randomRadius = radius - randomRange(0, radius * radiusRange);
		const v = randomRange(0, 1);
		const phi = randomRange(0, 2 * Math.PI);
		const theta = Math.acos(2 * v - 1);
		const rx = randomRadius * Math.cos(phi) * Math.sin(theta);
		let ry = randomRadius * Math.cos(theta);
		const rz = randomRadius * Math.sin(phi) * Math.sin(theta);
		if (isHemispheric) ry = Math.abs(ry);
		transformCoordinatesToRef(rx, ry, rz, emitterWorldMatrix, scratch);
		birthX = scratch.x;
		birthY = scratch.y;
		birthZ = scratch.z;
		posX[i] = birthX;
		posY[i] = birthY;
		posZ[i] = birthZ;
	};
	system.createDirection = (i) => {
		let dx;
		let dy;
		let dz;
		if (useExplicitDirections) {
			const direction1 = dir1Getter(i);
			const minX = direction1.x;
			const minY = direction1.y;
			const minZ = direction1.z;
			const direction2 = dir2Getter(i);
			dx = randomRange(minX, direction2.x);
			dy = randomRange(minY, direction2.y);
			dz = randomRange(minZ, direction2.z);
		} else {
			const directionRandomizer = directionRandomizerGetter(i);
			dx = birthX - emitter.x;
			dy = birthY - emitter.y;
			dz = birthZ - emitter.z;
			let length = Math.sqrt(dx * dx + dy * dy + dz * dz);
			if (length !== 0 && length !== 1) {
				dx /= length;
				dy /= length;
				dz /= length;
			}
			dx += randomRange(0, directionRandomizer);
			dy += randomRange(0, directionRandomizer);
			dz += randomRange(0, directionRandomizer);
			length = Math.sqrt(dx * dx + dy * dy + dz * dz);
			if (length !== 0 && length !== 1) {
				dx /= length;
				dy /= length;
				dz /= length;
			}
		}
		transformNormalToRef(dx, dy, dz, emitterWorldMatrix, scratch);
		dirX[i] = scratch.x;
		dirY[i] = scratch.y;
		dirZ[i] = scratch.z;
	};
} };
export { sphereShapeBlock };

//# sourceMappingURL=sphere-shape-block.js.map