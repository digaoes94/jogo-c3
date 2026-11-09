import { setPbrEmissive } from "../material/pbr/set-emissive.js";
// src/loader-gltf/gltf-ext-emissive-strength.ts
var ext = {
	id: "KHR_materials_emissive_strength",
	async applyMaterial(mat) {
		const e = mat._rawMatDef?.extensions?.KHR_materials_emissive_strength;
		if (!e) return null;
		const s = e.emissiveStrength ?? 1;
		const f = mat._emissiveFactor;
		const layer = {};
		setPbrEmissive(layer, [
			f[0] * s,
			f[1] * s,
			f[2] * s
		]);
		return layer;
	}
};
export { ext as default };

//# sourceMappingURL=gltf-ext-emissive-strength.js.map