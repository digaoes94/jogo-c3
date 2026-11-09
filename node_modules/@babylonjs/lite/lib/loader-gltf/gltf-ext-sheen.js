import { setPbrSheen } from "../material/pbr/set-sheen.js";
// src/loader-gltf/gltf-ext-sheen.ts
var ext = {
	id: "KHR_materials_sheen",
	async applyMaterial(mat, ctx) {
		const s = mat._rawMatDef?.extensions?.KHR_materials_sheen;
		if (!s) return null;
		const tex = await ctx._texture(s.sheenColorTexture, true);
		const roughInfo = s.sheenRoughnessTexture;
		const sameAsColor = roughInfo && s.sheenColorTexture && roughInfo.index === s.sheenColorTexture.index && roughInfo.extensions?.KHR_texture_transform === s.sheenColorTexture.extensions?.KHR_texture_transform;
		const roughnessTexture = roughInfo && !sameAsColor ? await ctx._texture(roughInfo, false) : void 0;
		const out = {};
		setPbrSheen(out, {
			isEnabled: true,
			color: s.sheenColorFactor ?? [
				0,
				0,
				0
			],
			roughness: s.sheenRoughnessFactor ?? 0,
			intensity: 1,
			texture: tex,
			...roughnessTexture ? { roughnessTexture } : void 0,
			albedoScaling: true
		});
		return out;
	}
};
export { ext as default };

//# sourceMappingURL=gltf-ext-sheen.js.map