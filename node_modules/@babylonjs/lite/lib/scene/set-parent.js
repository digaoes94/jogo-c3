import { decomposeMat4 } from "../math/decompose-mat4.js";
import { invertMat4 } from "../math/invert-mat4.js";
import { multiplyMat4 } from "../math/multiply-mat4.js";
// src/scene/set-parent.ts
/** SceneNodes expose a `children` array that traversal helpers walk. A foreign
*  IWorldMatrixProvider may not, so probe structurally. */
function childrenOf(node) {
	const kids = node?.children;
	return Array.isArray(kids) ? kids : null;
}
function setParent(child, parent) {
	const childWorld = child.worldMatrix;
	if (child.parent !== parent) {
		const oldChildren = childrenOf(child.parent);
		if (oldChildren) {
			const i = oldChildren.indexOf(child);
			if (i >= 0) oldChildren.splice(i, 1);
		}
		const newChildren = childrenOf(parent);
		if (newChildren && newChildren.indexOf(child) < 0) newChildren.push(child);
	}
	child.parent = parent;
	if (!parent) {
		applyLocal(childWorld.slice(), child, true);
		return;
	}
	const parentWorld = parent.worldMatrix;
	const invParent = invertMat4(parentWorld);
	if (!invParent) {
		if (child._localMatrix) applyLocal(child._localMatrix, child);
		child.position.set(childWorld[12], childWorld[13], childWorld[14]);
		return;
	}
	applyLocal(multiplyMat4(invParent, childWorld), child, true);
}
/** Decompose a local matrix and write it into a node's observable TRS. Writes the
*  rotation as a quaternion directly (the source of truth) — avoids the lossy
*  Euler round-trip near gimbal lock. */
function applyLocal(m, node, preserveMatrix = false) {
	const { translation, rotation, scale } = decomposeMat4(m);
	node._localMatrix = void 0;
	node._localMatrixLocked = void 0;
	node.position.set(translation.x, translation.y, translation.z);
	node.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
	node.scaling.set(scale.x, scale.y, scale.z);
	if (preserveMatrix) node._localMatrix = m;
}
export { setParent };

//# sourceMappingURL=set-parent.js.map