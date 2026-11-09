import "../../mesh-features.js";
import { createMorphFragment } from "../../../shader/fragments/morph-fragment-core.js";
// src/material/pbr/fragments/morph-fragment.ts
/**
* PBR Morph Target Extension
*
* Wires the shared morph fragment (shader/fragments/morph-fragment-core.ts)
* into the PBR material as a vertex-phase extension. The morph WGSL is
* composed at pipeline creation time — no global registration needed.
*/
var pbrExt = {
	id: "morph",
	phase: "vertex",
	frag(ctx) {
		if (!(ctx._meshFeatures & 8)) return null;
		return createMorphFragment();
	},
	bind(ctx, entries, b) {
		const mesh = ctx._mesh;
		if (!(ctx._meshFeatures & 8) || !mesh?.morphTargets) return b;
		entries.push({
			binding: b++,
			resource: { buffer: mesh.morphTargets.deltasBuffer }
		});
		if (mesh.morphTargets.weightsBuffer) entries.push({
			binding: b++,
			resource: { buffer: mesh.morphTargets.weightsBuffer }
		});
		return b;
	}
};
export { createMorphFragment, pbrExt };

//# sourceMappingURL=morph-fragment.js.map