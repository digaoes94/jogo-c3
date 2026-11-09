import "../../mesh-features.js";
import { createSkeletonFragment } from "../../../shader/fragments/skeleton-fragment.js";
// src/material/pbr/fragments/skeleton-fragment.ts
/** PBR wrapper around the material-agnostic shared skeleton fragment. */
var pbrExt = {
	id: "skeleton",
	phase: "vertex",
	frag(ctx) {
		if (!(ctx._meshFeatures & 2)) return null;
		return createSkeletonFragment((ctx._meshFeatures & 4) !== 0);
	},
	bind(ctx, entries, b) {
		const mesh = ctx._mesh;
		if (!(ctx._meshFeatures & 2) || !mesh?.skeleton) return b;
		entries.push({
			binding: b++,
			resource: mesh.skeleton.boneTexture.createView()
		});
		return b;
	}
};
export { createSkeletonFragment, pbrExt };

//# sourceMappingURL=skeleton-fragment.js.map