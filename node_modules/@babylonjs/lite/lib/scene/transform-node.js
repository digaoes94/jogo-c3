import { createSceneNode, createSceneNodeFromMatrix } from "./scene-node.js";
import { initMeshTransform } from "../mesh/mesh.js";
import { retain } from "../resource/ref-count.js";
import { copyLightBase } from "../light/light-clone.js";
// src/scene/transform-node.ts
/** Create a TransformNode (SceneNode) with TRS values and lazy world matrix.
*  Parameters: name, position (px,py,pz), rotation quaternion (qx,qy,qz,qw), scaling (sx,sy,sz).
*  Omitted values default to the identity transform (applied once, in `initSceneNodeTransform`). */
function createTransformNode(name, px, py, pz, qx, qy, qz, qw, sx, sy, sz) {
	return createSceneNode(name, px, py, pz, qx, qy, qz, qw, sx, sy, sz);
}
/** Deep-clone a SceneNode tree. Meshes share ref-counted GPU buffers; specialized
*  SceneNodes such as lights provide their own independent clone constructor. */
function cloneTransformNode(src) {
	if ("_gpu" in src) return cloneMeshNode(src);
	const clone = src._cloneNode?.(copyLightBase) ?? (src._localMatrix ? src._localMatrixLocked ? createSceneNodeFromMatrix(src.name + "_clone", src._localMatrix.slice()) : createSceneNodeFromMatrix(src.name + "_clone", src._localMatrix.slice(), src.position, src.rotationQuaternion, src.scaling) : createTransformNode(src.name + "_clone", src.position.x, src.position.y, src.position.z, src.rotationQuaternion.x, src.rotationQuaternion.y, src.rotationQuaternion.z, src.rotationQuaternion.w, src.scaling.x, src.scaling.y, src.scaling.z));
	for (const child of src.children) {
		const childClone = cloneTransformNode(child);
		childClone.parent = clone;
		clone.children.push(childClone);
	}
	return clone;
}
function cloneMeshNode(mesh) {
	if (mesh._clone) throw Error(mesh._clone);
	if (mesh._disposed) throw Error(`Mesh "${mesh.name}" cannot be cloned: it was disposed when it left its last scene.`);
	const meshClone = initMeshTransform({
		...mesh,
		name: mesh.name + "_clone",
		children: [],
		_gpu: mesh._gpu,
		_localMatrix: void 0,
		_localMatrixLocked: void 0
	}, mesh.position.x, mesh.position.y, mesh.position.z, 0, 0, 0, mesh.scaling.x, mesh.scaling.y, mesh.scaling.z);
	for (const r of [
		mesh._gpu,
		mesh.skeleton,
		mesh.vat,
		mesh.morphTargets,
		mesh.thinInstances
	]) if (r) retain(r);
	const rq = mesh.rotationQuaternion;
	meshClone.rotationQuaternion.set(rq.x, rq.y, rq.z, rq.w);
	if (mesh._localMatrix) {
		meshClone._localMatrix = mesh._localMatrix.slice();
		meshClone._localMatrixLocked = mesh._localMatrixLocked;
	}
	for (const child of mesh.children) {
		const childClone = cloneTransformNode(child);
		childClone.parent = meshClone;
		meshClone.children.push(childClone);
	}
	return meshClone;
}
export { cloneTransformNode, createTransformNode };

//# sourceMappingURL=transform-node.js.map