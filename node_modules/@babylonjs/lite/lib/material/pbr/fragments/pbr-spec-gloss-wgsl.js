// src/material/pbr/fragments/pbr-spec-gloss-wgsl.ts
/** Roughness/metallic from the specular-glossiness texture (glossiness in alpha). */
function specGlossRoughness(specGlossUV) {
	return `let specGloss=textureSample(specGlossTexture,specGlossSampler,${specGlossUV});var roughness=clamp(1.0-specGloss.a,0.0,1.0);var metallic=0.0;`;
}
/** F0 from the specular color, with energy conservation against the max specular channel. */
var SPEC_GLOSS_F0 = `var colorF0=specGloss.rgb;let colorF90=vec3<f32>(1.0);let maxSpecular=max(colorF0.r,max(colorF0.g,colorF0.b));var surfaceAlbedo=baseColor*(1.0-maxSpecular);`;
export { SPEC_GLOSS_F0, specGlossRoughness };

//# sourceMappingURL=pbr-spec-gloss-wgsl.js.map