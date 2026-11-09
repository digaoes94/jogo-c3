// src/material/pbr/pbr-material-accessors.ts
var defaultUnlitColor = [
	1,
	1,
	1
];
var defaultShadowOnly = {
	color: [
		0,
		0,
		0
	],
	opacity: 1,
	falloff: 1
};
function getPbrAlphaCutoff(material) {
	return material._alphaCutOff;
}
function getPbrEmissiveColor(material) {
	return material._emissiveColor;
}
function getPbrMetallicReflectance(material) {
	if (material._metallicReflectanceColor === void 0 && material._metallicReflectanceTexture === void 0 && material._reflectanceTexture === void 0 && material._metallicF0Factor === void 0 && material._specularWeight === void 0 && material._useOnlyMetallicFromMetallicReflectanceTexture === void 0) return;
	return {
		color: material._metallicReflectanceColor,
		texture: material._metallicReflectanceTexture,
		reflectanceTexture: material._reflectanceTexture,
		f0Factor: material._metallicF0Factor,
		specularWeight: material._specularWeight,
		useOnlyMetallicFromTexture: material._useOnlyMetallicFromMetallicReflectanceTexture
	};
}
function getPbrClearCoat(material) {
	return material._clearCoat;
}
function getPbrSheen(material) {
	return material._sheen;
}
function getPbrIridescence(material) {
	return material._iridescence;
}
function getPbrAnisotropy(material) {
	return material._anisotropy;
}
function getPbrSubsurface(material) {
	return material._subsurface;
}
function getPbrTransmission(material) {
	return material._transmissive ? material._subsurface?.refraction : void 0;
}
function getPbrDispersion(material) {
	return material._subsurface?.refraction?.dispersion;
}
function isPbrGammaAlbedo(material) {
	return material._gammaAlbedo === true;
}
function getPbrUnlit(material) {
	return material._unlit === true ? material._unlitColor ?? defaultUnlitColor : void 0;
}
function isPbrSkybox(material) {
	return material._skyboxMode === true;
}
function getShadowOnly(material) {
	if (material._shadowOnly !== true) return;
	if (material._shadowOnlyColor === void 0 && material._shadowOnlyOpacity === void 0 && material._shadowOnlyFalloff === void 0) return defaultShadowOnly;
	return {
		color: material._shadowOnlyColor ?? defaultShadowOnly.color,
		opacity: material._shadowOnlyOpacity ?? 1,
		falloff: material._shadowOnlyFalloff ?? 1
	};
}
export { getPbrAlphaCutoff, getPbrAnisotropy, getPbrClearCoat, getPbrDispersion, getPbrEmissiveColor, getPbrIridescence, getPbrMetallicReflectance, getPbrSheen, getPbrSubsurface, getPbrTransmission, getPbrUnlit, getShadowOnly, isPbrGammaAlbedo, isPbrSkybox };

//# sourceMappingURL=pbr-material-accessors.js.map