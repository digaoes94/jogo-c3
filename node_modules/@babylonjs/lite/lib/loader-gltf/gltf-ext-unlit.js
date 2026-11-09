import { setPbrUnlit } from "../material/pbr/set-unlit.js";
// src/loader-gltf/gltf-ext-unlit.ts
var ext = {
	id: "KHR_materials_unlit",
	async applyMaterial(mat) {
		if (!mat._rawMatDef?.extensions?.KHR_materials_unlit) return null;
		const out = {};
		setPbrUnlit(out);
		return out;
	}
};
export { ext as default };

//# sourceMappingURL=gltf-ext-unlit.js.map