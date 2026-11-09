import { BU } from "../engine/gpu-flags.js";
import { createMappedBuffer } from "../resource/mapped-buffer.js";
import { eulerXYZToQuatTuple } from "../math/quat-euler.js";
import { initSceneNodeTransform } from "../scene/scene-node.js";
// src/mesh/mesh.ts
/** High-level Mesh — position/rotation/scaling + material + GPU geometry.
*  Plain data (no scene reference). The scene collects meshes via addToScene(). */
/** Wire ObservableVec3/ObservableQuat TRS and children onto a partially-built mesh object.
*  Used by all mesh creation paths (factories, loaders). */
function initMeshTransform(partialMesh, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
	const [iqx, iqy, iqz, iqw] = eulerXYZToQuatTuple(rx, ry, rz);
	const mesh = initSceneNodeTransform({
		children: [],
		...partialMesh
	}, px, py, pz, iqx, iqy, iqz, iqw, sx, sy, sz);
	Object.defineProperties(mesh, {
		worldMatrix: { enumerable: false },
		worldMatrixVersion: { enumerable: false }
	});
	return mesh;
}
/** Upload typed arrays to GPU buffers and return a MeshGPU handle. */
function uploadMeshToGPU(engine, positions, normals, indices, uvs, uvs2, tangents, colors) {
	const device = engine._device;
	const positionBuffer = createMappedBuffer(engine, positions, BU.VERTEX);
	const normalBuffer = createMappedBuffer(engine, normals, BU.VERTEX);
	const indexBuffer = createMappedBuffer(engine, indices, BU.INDEX);
	let uvBuffer;
	if (uvs && uvs.length > 0) uvBuffer = createMappedBuffer(engine, uvs, BU.VERTEX);
	else {
		uvBuffer = device.createBuffer({
			size: positions.length / 3 * 8,
			usage: BU.VERTEX,
			mappedAtCreation: true
		});
		uvBuffer.unmap();
	}
	let uv2Buffer = null;
	if (uvs2 && uvs2.length > 0) uv2Buffer = createMappedBuffer(engine, uvs2, BU.VERTEX);
	const tangentBuffer = tangents && tangents.length > 0 ? createMappedBuffer(engine, tangents, BU.VERTEX) : null;
	const colorBuffer = colors && colors.length > 0 ? createMappedBuffer(engine, colors, BU.VERTEX) : null;
	return {
		positionBuffer,
		normalBuffer,
		uvBuffer,
		uv2Buffer,
		tangentBuffer,
		colorBuffer,
		hasUv: !!uvs && uvs.length > 0,
		hasUv2: !!uvs2 && uvs2.length > 0,
		hasTangent: !!tangents && tangents.length > 0,
		hasColor: !!colors && colors.length > 0,
		indexBuffer,
		indexCount: indices.length,
		indexFormat: "uint32"
	};
}
export { initMeshTransform, uploadMeshToGPU };

//# sourceMappingURL=mesh.js.map