import { setPbrClearCoat } from "../material/pbr/set-clearcoat.js";
// src/loader-gltf/gltf-ext-clearcoat.ts
var ext = {
	id: "KHR_materials_clearcoat",
	async applyMaterial(mat, ctx) {
		const c = mat._rawMatDef?.extensions?.KHR_materials_clearcoat;
		if (!c) return null;
		const [tex, rough, normal] = await Promise.all([
			ctx._texture(c.clearcoatTexture, false),
			ctx._texture(c.clearcoatRoughnessTexture, false),
			ctx._texture(c.clearcoatNormalTexture, false)
		]);
		const out = {};
		setPbrClearCoat(out, {
			isEnabled: true,
			intensity: c.clearcoatFactor ?? (c.clearcoatTexture ? 1 : 0),
			roughness: c.clearcoatRoughnessFactor ?? (c.clearcoatRoughnessTexture ? 1 : 0),
			texture: tex,
			roughnessTexture: rough,
			bumpTexture: normal,
			bumpTextureScale: c.clearcoatNormalTexture?.scale ?? 1,
			useF0Remap: false
		});
		return out;
	}
};
export { ext as default };

//# sourceMappingURL=gltf-ext-clearcoat.js.map