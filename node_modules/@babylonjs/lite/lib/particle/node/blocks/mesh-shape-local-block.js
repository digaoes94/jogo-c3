import { randomRange } from "../../../math/random-range.js";
import { finishLocalPosition } from "../npe-local-position.js";
// src/particle/node/blocks/mesh-shape-local-block.ts
/** Emitter-local `MeshShapeBlock`. */
var meshShapeLocalBlock = { build(block, ctx) {
	const cached = block.serialized.cachedVertexData;
	const positions = cached?.positions;
	const indices = cached?.indices;
	if (!positions || !indices) return;
	const system = ctx.state.system;
	const buffer = ctx.state.buffer;
	const emitterWorldMatrix = ctx.state.emitterWorldMatrix;
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
	let normalX = 0;
	let normalY = 0;
	let normalZ = 0;
	const scratch = {
		x: 0,
		y: 0,
		z: 0
	};
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
		buffer.posX[i] = bu * positions[ia * 3] + bv * positions[ib * 3] + bw * positions[ic * 3];
		buffer.posY[i] = bu * positions[ia * 3 + 1] + bv * positions[ib * 3 + 1] + bw * positions[ic * 3 + 1];
		buffer.posZ[i] = bu * positions[ia * 3 + 2] + bv * positions[ib * 3 + 2] + bw * positions[ic * 3 + 2];
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
		finishLocalPosition(system, buffer, i, emitterWorldMatrix, scratch);
	};
	system.createDirection = (i) => {
		if (useNormals) {
			buffer.dirX[i] = normalX;
			buffer.dirY[i] = normalY;
			buffer.dirZ[i] = normalZ;
			return;
		}
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
export { meshShapeLocalBlock };

//# sourceMappingURL=mesh-shape-local-block.js.map