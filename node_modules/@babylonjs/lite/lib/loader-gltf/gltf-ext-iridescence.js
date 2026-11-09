import { setPbrIridescence } from "../material/pbr/set-iridescence.js";
// src/loader-gltf/gltf-ext-iridescence.ts
var ext = {
	id: "KHR_materials_iridescence",
	async applyMaterial(mat, ctx) {
		const iri = mat._rawMatDef?.extensions?.KHR_materials_iridescence;
		if (!iri) return null;
		const [tex, thicknessTex] = await Promise.all([ctx._texture(iri.iridescenceTexture, true), ctx._texture(iri.iridescenceThicknessTexture, true)]);
		const out = {};
		setPbrIridescence(out, {
			isEnabled: true,
			intensity: iri.iridescenceFactor ?? 0,
			indexOfRefraction: iri.iridescenceIor ?? 1.3,
			minimumThickness: iri.iridescenceThicknessMinimum ?? 100,
			maximumThickness: iri.iridescenceThicknessMaximum ?? 400,
			texture: tex,
			thicknessTexture: thicknessTex
		});
		return out;
	}
};
export { ext as default };

//# sourceMappingURL=gltf-ext-iridescence.js.map