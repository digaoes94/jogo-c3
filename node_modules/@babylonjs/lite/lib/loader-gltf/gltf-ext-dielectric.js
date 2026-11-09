// src/loader-gltf/gltf-ext-dielectric.ts
var ext = {
	id: "KHR_materials_dielectric",
	async applyMaterial(mat, ctx) {
		const exts = mat._rawMatDef?.extensions;
		if (!exts) return null;
		const eIor = exts.KHR_materials_ior;
		const eSp = exts.KHR_materials_specular;
		const eVol = exts.KHR_materials_volume;
		const eTx = exts.KHR_materials_transmission;
		const eDisp = exts.KHR_materials_dispersion;
		if (!eIor && !eSp && !eVol && !eTx && !eDisp) return null;
		const ior = typeof eIor?.ior === "number" ? eIor.ior : 1.5;
		const intensity = typeof eTx?.transmissionFactor === "number" ? eTx.transmissionFactor : 0;
		const thicknessFactor = typeof eVol?.thicknessFactor === "number" ? eVol.thicknessFactor : 0;
		const dispersion = typeof eDisp?.dispersion === "number" ? eDisp.dispersion : 0;
		const specColFactor = eSp?.specularColorFactor;
		const needsTransmission = !!eTx && (intensity > 0 || !!eTx.transmissionTexture);
		const needsDispersion = dispersion > 0 && (!!eIor || needsTransmission) && !!eVol && (thicknessFactor > 0 || !!eVol.thicknessTexture);
		const needsReflectance = !!eSp?.specularTexture || !!eSp?.specularColorTexture || !!eIor && ior !== 1.5 || typeof eSp?.specularFactor === "number" && Math.abs(eSp.specularFactor - 1) > 1e-6 || Array.isArray(specColFactor) && specColFactor.length === 3 && (specColFactor[0] !== 1 || specColFactor[1] !== 1 || specColFactor[2] !== 1);
		const [specTex, specColTex, thickTex, transTex, transmissionMod, dispersionMod, reflectanceMod] = await Promise.all([
			ctx._texture(eSp?.specularTexture, false),
			ctx._texture(eSp?.specularColorTexture, false),
			ctx._texture(eVol?.thicknessTexture, false),
			ctx._texture(eTx?.transmissionTexture, false),
			needsTransmission ? import("../material/pbr/set-transmission.js") : void 0,
			needsDispersion ? import("../material/pbr/set-dispersion.js") : void 0,
			needsReflectance ? import("../material/pbr/set-metallic-reflectance.js") : void 0
		]);
		const out = {};
		const subsurface = {};
		const reflOpts = {};
		let hasRefl = false;
		if (eIor) {
			if (ior !== 1.5) {
				reflOpts.f0Factor = ((ior - 1) / (ior + 1)) ** 2 / .04;
				reflOpts.specularWeight = 1;
				hasRefl = true;
			}
			subsurface.refraction = { indexOfRefraction: ior };
		}
		if (eSp) {
			if (typeof eSp.specularFactor === "number") {
				if (Math.abs(eSp.specularFactor - 1) > 1e-6) {
					reflOpts.f0Factor = eSp.specularFactor;
					reflOpts.specularWeight = eSp.specularFactor;
					hasRefl = true;
				} else {
					delete reflOpts.f0Factor;
					delete reflOpts.specularWeight;
				}
			}
			if (Array.isArray(eSp.specularColorFactor) && eSp.specularColorFactor.length === 3) {
				if (eSp.specularColorFactor[0] !== 1 || eSp.specularColorFactor[1] !== 1 || eSp.specularColorFactor[2] !== 1) {
					reflOpts.color = [
						eSp.specularColorFactor[0],
						eSp.specularColorFactor[1],
						eSp.specularColorFactor[2]
					];
					hasRefl = true;
				}
			}
			if (specTex) {
				reflOpts.texture = specTex;
				reflOpts.useOnlyMetallicFromTexture = true;
			}
			if (specColTex) reflOpts.reflectanceTexture = specColTex;
		}
		if (eVol) {
			if (thicknessFactor > 0 || thickTex) subsurface.thickness = {
				min: 0,
				max: thicknessFactor || 1,
				useGlTFChannel: true,
				...thickTex ? { texture: thickTex } : void 0
			};
			const color = Array.isArray(eVol.attenuationColor) && eVol.attenuationColor.length === 3 ? eVol.attenuationColor : void 0;
			const atDistance = typeof eVol.attenuationDistance === "number" ? eVol.attenuationDistance : void 0;
			if (color || atDistance !== void 0) subsurface.tint = {
				...color ? { color } : void 0,
				...atDistance !== void 0 ? { atDistance } : void 0
			};
			else if (subsurface.thickness) subsurface.tint = {
				color: [
					1,
					1,
					1
				],
				atDistance: 1
			};
		}
		if (transmissionMod && (intensity > 0 || transTex)) {
			out._subsurface = subsurface;
			transmissionMod.setPbrTransmission(out, {
				...subsurface.refraction ?? {},
				intensity,
				useThicknessAsDepth: !!subsurface.thickness,
				...transTex ? { texture: transTex } : void 0
			});
		}
		if (dispersionMod && subsurface.refraction && subsurface.thickness) {
			out._subsurface = subsurface;
			dispersionMod.setPbrDispersion(out, 20 / dispersion);
		}
		if (Object.keys(subsurface).length > 0) out._subsurface = subsurface;
		if (reflectanceMod && (reflOpts.texture || reflOpts.reflectanceTexture || hasRefl)) reflectanceMod.setPbrMetallicReflectance(out, reflOpts);
		return Object.keys(out).length > 0 ? out : null;
	}
};
export { ext as default };

//# sourceMappingURL=gltf-ext-dielectric.js.map