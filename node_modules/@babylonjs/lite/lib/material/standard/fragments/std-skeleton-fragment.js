import "../../mesh-features.js";
import { HAS_SKELETON, HAS_SKELETON_8 } from "../standard-flags.js";
import { createSkeletonFragment } from "../../../shader/fragments/skeleton-fragment.js";
// src/material/standard/fragments/std-skeleton-fragment.ts
var stdSkeletonExt = {
	_id: "std-skeleton",
	_phase: "mesh",
	_feature: HAS_SKELETON,
	_meshFeatures(meshFeatures) {
		if ((meshFeatures & 2) === 0 || (meshFeatures & 16) !== 0) return 0;
		return HAS_SKELETON | ((meshFeatures & 4) !== 0 ? HAS_SKELETON_8 : 0);
	},
	_frag(features) {
		const fragment = createSkeletonFragment((features & HAS_SKELETON_8) !== 0);
		return {
			...fragment,
			_id: "std-skeleton",
			_bindings: fragment._vertexBindings,
			_vertexBindings: void 0
		};
	},
	_bind(_material, entries, binding, mesh) {
		const skeleton = mesh?.skeleton;
		if (!skeleton) return binding;
		entries.push({
			binding: binding++,
			resource: skeleton.boneTexture.createView()
		});
		return binding;
	},
	_bindVertexBuffers(mesh, pass, slot) {
		const skeleton = mesh.skeleton;
		if (!skeleton) return slot;
		pass.setVertexBuffer(slot++, skeleton.jointsBuffer);
		pass.setVertexBuffer(slot++, skeleton.weightsBuffer);
		if (skeleton.joints1Buffer && skeleton.weights1Buffer) {
			pass.setVertexBuffer(slot++, skeleton.joints1Buffer);
			pass.setVertexBuffer(slot++, skeleton.weights1Buffer);
		}
		return slot;
	}
};
export { stdSkeletonExt };

//# sourceMappingURL=std-skeleton-fragment.js.map