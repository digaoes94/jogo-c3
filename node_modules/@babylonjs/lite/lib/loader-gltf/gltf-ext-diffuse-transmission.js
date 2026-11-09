import { setPbrSubsurface } from "../material/pbr/set-subsurface.js";
// src/loader-gltf/gltf-ext-diffuse-transmission.ts
var ext = {
	id: "KHR_materials_diffuse_transmission",
	async applyMaterial(mat, ctx) {
		const e = mat._rawMatDef?.extensions?.KHR_materials_diffuse_transmission;
		if (!e) return null;
		const intensity = typeof e.diffuseTransmissionFactor === "number" ? e.diffuseTransmissionFactor : 0;
		const [colorTex, intensityTex] = await Promise.all([ctx._texture(e.diffuseTransmissionColorTexture, true), ctx._texture(e.diffuseTransmissionTexture, false)]);
		if (intensity <= 0 && !colorTex && !intensityTex) return null;
		const cf = Array.isArray(e.diffuseTransmissionColorFactor) && e.diffuseTransmissionColorFactor.length === 3 ? e.diffuseTransmissionColorFactor : [
			1,
			1,
			1
		];
		const out = {};
		setPbrSubsurface(out, {
			translucency: {
				intensity,
				color: [
					cf[0],
					cf[1],
					cf[2]
				],
				...colorTex ? { colorTexture: colorTex } : void 0,
				...intensityTex ? { intensityTexture: intensityTex } : void 0
			},
			thickness: {
				min: 0,
				max: 0
			}
		});
		return out;
	}
};
export { ext as default };

//# sourceMappingURL=gltf-ext-diffuse-transmission.js.map