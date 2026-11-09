import { transformCoordinatesToRef, transformNormalToRef } from "../../../math/mat4-transform.js";
import { randomRange } from "../../../math/random-range.js";
// src/particle/node/blocks/mesh-shape-block.ts
/** `MeshShapeBlock` — sample cached triangle geometry and interpolate its vertex data. */
var meshShapeBlock = { build(block, ctx) {
	const cached = block.serialized.cachedVertexData;
	const positions = cached?.positions;
	const indices = cached?.indices;
	if (!positions || !indices) return;
	const state = ctx.state;
	const system = state.system;
	const buffer = state.buffer;
	const emitterWorldMatrix = state.emitterWorldMatrix;
	const normals = cached.normals;
	const colors = cached.colors;
	const useNormals = block.serialized.useMeshNormalsForDirection !== false && !!normals;
	const useColors = block.serialized.useMeshColorForColor === true && !!colors;
	if (useNormals) system._suppressInitialDirectionCapture = true;
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
	let normalX = 0;
	let normalY = 0;
	let normalZ = 0;
	let colorR = null;
	let colorG = null;
	let colorB = null;
	let colorA = null;
	if (useColors) {
		colorR = buffer.colorR;
		colorG = buffer.colorG;
		colorB = buffer.colorB;
		colorA = buffer.colorA;
		system.createColor = null;
	}
	system.createPosition = (i) => {
		const face = 3 * (Math.random() * (indices.length / 3) | 0);
		const bu = Math.random();
		const bv = Math.random() * (1 - bu);
		const bw = 1 - bu - bv;
		const ia = indices[face];
		const ib = indices[face + 1];
		const ic = indices[face + 2];
		const x = bu * positions[ia * 3] + bv * positions[ib * 3] + bw * positions[ic * 3];
		const y = bu * positions[ia * 3 + 1] + bv * positions[ib * 3 + 1] + bw * positions[ic * 3 + 1];
		const z = bu * positions[ia * 3 + 2] + bv * positions[ib * 3 + 2] + bw * positions[ic * 3 + 2];
		transformCoordinatesToRef(x, y, z, emitterWorldMatrix, scratch);
		buffer.posX[i] = scratch.x;
		buffer.posY[i] = scratch.y;
		buffer.posZ[i] = scratch.z;
		if (useNormals) {
			normalX = bu * normals[ia * 3] + bv * normals[ib * 3] + bw * normals[ic * 3];
			normalY = bu * normals[ia * 3 + 1] + bv * normals[ib * 3 + 1] + bw * normals[ic * 3 + 1];
			normalZ = bu * normals[ia * 3 + 2] + bv * normals[ib * 3 + 2] + bw * normals[ic * 3 + 2];
		}
		if (useColors) {
			colorR[i] = bu * colors[ia * 4] + bv * colors[ib * 4] + bw * colors[ic * 4];
			colorG[i] = bu * colors[ia * 4 + 1] + bv * colors[ib * 4 + 1] + bw * colors[ic * 4 + 1];
			colorB[i] = bu * colors[ia * 4 + 2] + bv * colors[ib * 4 + 2] + bw * colors[ic * 4 + 2];
			colorA[i] = bu * colors[ia * 4 + 3] + bv * colors[ib * 4 + 3] + bw * colors[ic * 4 + 3];
		}
	};
	system.createDirection = (i) => {
		let x;
		let y;
		let z;
		if (useNormals) {
			x = normalX;
			y = normalY;
			z = normalZ;
		} else {
			const direction1 = direction1Getter(i);
			const minX = direction1.x;
			const minY = direction1.y;
			const minZ = direction1.z;
			const direction2 = direction2Getter(i);
			x = randomRange(minX, direction2.x);
			y = randomRange(minY, direction2.y);
			z = randomRange(minZ, direction2.z);
		}
		transformNormalToRef(x, y, z, emitterWorldMatrix, scratch);
		buffer.dirX[i] = scratch.x;
		buffer.dirY[i] = scratch.y;
		buffer.dirZ[i] = scratch.z;
	};
} };
export { meshShapeBlock };

//# sourceMappingURL=mesh-shape-block.js.map