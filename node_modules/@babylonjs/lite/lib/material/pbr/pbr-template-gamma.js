// src/material/pbr/pbr-template-gamma.ts
function gammaBaseColor(baseColorFactorRgb, baseColorFactorAlpha, vertexColorMod) {
	return `var baseColor=pow(baseColorSample.rgb,vec3<f32>(2.2))${baseColorFactorRgb};var alpha=baseColorSample.a${baseColorFactorAlpha};${vertexColorMod}`;
}
export { gammaBaseColor };

//# sourceMappingURL=pbr-template-gamma.js.map