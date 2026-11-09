import { F32, I32, U8 } from "../engine/typed-arrays.js";
import { composeMat4IntoBuffer } from "../math/compose-mat4-into-buffer.js";
import { multiplyMat4IntoBuffer } from "../math/multiply-mat4-into-buffer.js";
import { _rightHanded } from "#coordinate-system";
// src/skeleton/skeleton-pose.ts
/** Skeletal-pose bake primitives for the opt-in bone-control eager bake.
*
*  Mirrors the per-frame math the animation tick (skeleton-updater.ts) runs, but
*  lives in the bone-control chunk so the always-fetched tick stays byte-identical
*  to a build without bone control. Only imported by bone-control.ts. */
/** TRS layout per node: 12 floats — [0..2] translation, [3..6] rotation (xyzw), [7..9] scale. */
var TRS_STRIDE = 12;
var T_OFF = 0;
var R_OFF = 3;
var S_OFF = 7;
var ROOT_TRANSFORM = new F32([
	_rightHanded ? 1 : -1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1
]);
var _boneTmp = new F32(16);
/** Compute topological order so parents are processed before children. */
function computeTopoOrder(nodes) {
	const n = nodes.length;
	const order = new I32(n);
	const visited = new U8(n);
	let cursor = 0;
	function visit(idx) {
		if (visited[idx]) return;
		visited[idx] = 1;
		const p = nodes[idx].parentIdx;
		if (p >= 0) visit(p);
		order[cursor++] = idx;
	}
	for (let i = 0; i < n; i++) visit(i);
	return order;
}
/** Reset every node's working TRS to its rest pose. */
function resetTRS(nodes, numNodes, currentTRS) {
	for (let i = 0; i < numNodes; i++) {
		const n = nodes[i];
		const off = i * 12;
		currentTRS[off + 0] = n.tx;
		currentTRS[off + 0 + 1] = n.ty;
		currentTRS[off + 0 + 2] = n.tz;
		currentTRS[off + 3] = n.rx;
		currentTRS[off + 3 + 1] = n.ry;
		currentTRS[off + 3 + 2] = n.rz;
		currentTRS[off + 3 + 3] = n.rw;
		currentTRS[off + 7] = n.sx;
		currentTRS[off + 7 + 1] = n.sy;
		currentTRS[off + 7 + 2] = n.sz;
	}
}
/** Compose local matrices from `currentTRS` (or a node's fixed `_matrix`) and
*  multiply each into world space in topological order. */
function computeNodeWorldMatrices(nodes, numNodes, topoOrder, currentTRS, localMat, worldMat, worldOverrides) {
	for (let idx = 0; idx < numNodes; idx++) {
		const nodeIdx = topoOrder[idx];
		const worldOverride = worldOverrides?.get(nodeIdx);
		if (worldOverride) {
			worldMat.set(worldOverride, nodeIdx * 16);
			continue;
		}
		const node = nodes[nodeIdx];
		const off = nodeIdx * 12;
		if (node._matrix) localMat.set(node._matrix, nodeIdx * 16);
		else composeMat4IntoBuffer(localMat, nodeIdx * 16, currentTRS[off + 0], currentTRS[off + 0 + 1], currentTRS[off + 0 + 2], currentTRS[off + 3], currentTRS[off + 3 + 1], currentTRS[off + 3 + 2], currentTRS[off + 3 + 3], currentTRS[off + 7], currentTRS[off + 7 + 1], currentTRS[off + 7 + 2]);
		const parentIdx = node.parentIdx;
		if (parentIdx >= 0) multiplyMat4IntoBuffer(worldMat, nodeIdx * 16, worldMat, parentIdx * 16, localMat, nodeIdx * 16);
		else multiplyMat4IntoBuffer(worldMat, nodeIdx * 16, ROOT_TRANSFORM, 0, localMat, nodeIdx * 16);
	}
}
/** Compute each skeleton's bone matrices (`invMeshWorld · jointWorld · IBM`) and
*  upload them to the bone textures. */
function writeBoneTextures(device, skeletons, worldMat) {
	for (let si = 0; si < skeletons.length; si++) {
		const skel = skeletons[si];
		if (skel.runtimeSkeleton?._disposed) continue;
		const boneData = skel.boneMatrices;
		for (let bi = 0; bi < skel.boneCount; bi++) {
			const jointIdx = skel.jointNodes[bi];
			const ibmOff = bi * 16;
			multiplyMat4IntoBuffer(_boneTmp, 0, skel.invMeshWorld, 0, worldMat, jointIdx * 16);
			multiplyMat4IntoBuffer(boneData, bi * 16, _boneTmp, 0, skel.inverseBindMatrices, ibmOff);
		}
		const texWidth = skel.boneCount * 4;
		device.queue.writeTexture({ texture: skel.runtimeSkeleton?.boneTexture ?? skel.boneTexture }, boneData.buffer, { bytesPerRow: texWidth * 16 }, {
			width: texWidth,
			height: 1
		});
	}
}
export { R_OFF, S_OFF, TRS_STRIDE, T_OFF, computeNodeWorldMatrices, computeTopoOrder, resetTRS, writeBoneTextures };

//# sourceMappingURL=skeleton-pose.js.map