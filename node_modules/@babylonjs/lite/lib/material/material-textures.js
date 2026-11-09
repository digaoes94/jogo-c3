import { getMaterialSource } from "./material-view.js";
import { getShaderTexture } from "./shader/shader-material.js";
import { _getParallaxHeightTexture, _getStandardParallaxHeightTexture } from "./parallax/parallax-occlusion.js";
import { getStandardAmbientTexture, getStandardBumpTexture, getStandardEmissiveTexture, getStandardLightmapTexture, getStandardOpacityTexture, getStandardReflectionTexture, getStandardSpecularTexture } from "./standard/standard-material-accessors.js";
import { getPbrAnisotropy, getPbrClearCoat, getPbrIridescence, getPbrMetallicReflectance, getPbrSheen, getPbrSubsurface, getPbrTransmission } from "./pbr/pbr-material-accessors.js";
import { getMaterialFamily } from "./material-family.js";
// src/material/material-textures.ts
/**
* Gets the non-null 2D textures currently bound by a material.
* @param material - Material or material view to inspect.
* @returns A newly allocated readonly array of bound texture handles. Unknown material families return an empty array.
*/
function getMaterialTextures(material) {
	const source = getMaterialSource(material);
	switch (getMaterialFamily(source)) {
		case "pbr": return getPbrTextures(source);
		case "standard": return getStandardTextures(source);
		case "shader": return getShaderTextures(source);
		case "node": return getNodeTextures(source.inputs);
		default: return [];
	}
}
function getNodeTextures(inputs) {
	const textures = [];
	for (const name in inputs) if (Object.hasOwn(inputs, name)) {
		const input = inputs[name];
		if (input.type === "texture2d") pushTexture(textures, input.texture);
	}
	return textures;
}
function getShaderTextures(material) {
	const textures = [];
	for (const declaration of material.samplerDecls) pushTexture(textures, getShaderTexture(material, declaration.name));
	return textures;
}
function getPbrTextures(material) {
	const textures = [];
	for (const texture of [
		material.baseColorTexture,
		material.normalTexture,
		material.ormTexture,
		material.occlusionTexture,
		material.emissiveTexture,
		material.specGlossTexture,
		material.lightmapTexture
	]) pushTexture(textures, texture);
	const reflectance = getPbrMetallicReflectance(material);
	pushTexture(textures, reflectance?.texture);
	pushTexture(textures, reflectance?.reflectanceTexture);
	const clearCoat = getPbrClearCoat(material);
	pushTexture(textures, clearCoat?.texture);
	pushTexture(textures, clearCoat?.roughnessTexture);
	pushTexture(textures, clearCoat?.bumpTexture);
	const sheen = getPbrSheen(material);
	pushTexture(textures, sheen?.texture);
	pushTexture(textures, sheen?.roughnessTexture);
	const iridescence = getPbrIridescence(material);
	pushTexture(textures, iridescence?.texture);
	pushTexture(textures, iridescence?.thicknessTexture);
	pushTexture(textures, getPbrAnisotropy(material)?.texture);
	const subsurface = getPbrSubsurface(material);
	pushTexture(textures, subsurface?.translucency?.colorTexture);
	pushTexture(textures, subsurface?.translucency?.intensityTexture);
	pushTexture(textures, subsurface?.thickness?.texture);
	pushTexture(textures, getPbrTransmission(material)?.texture);
	pushTexture(textures, material.bentNormalTexture);
	pushTexture(textures, _getParallaxHeightTexture(material));
	return textures;
}
function getStandardTextures(material) {
	const textures = [];
	pushTexture(textures, material.diffuseTexture);
	pushTexture(textures, getStandardEmissiveTexture(material));
	pushTexture(textures, getStandardBumpTexture(material));
	pushTexture(textures, getStandardSpecularTexture(material));
	pushTexture(textures, getStandardAmbientTexture(material));
	pushTexture(textures, getStandardLightmapTexture(material));
	pushTexture(textures, getStandardOpacityTexture(material));
	pushTexture(textures, getStandardReflectionTexture(material));
	pushTexture(textures, _getStandardParallaxHeightTexture(material));
	return textures;
}
function pushTexture(textures, texture) {
	if (texture) textures.push(texture);
}
export { getMaterialTextures };

//# sourceMappingURL=material-textures.js.map