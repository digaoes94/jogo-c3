// src/material/pbr/fragments/pbr-normal-tangent-wgsl.ts
/** Vertex-stage tangent frame, written to the worldTangent/worldBitangent varyings. */
function tangentFrameVertex(normVar) {
	return `let N_local=normalize(${normVar});let T_local=normalize(tangent.xyz);let B_local=cross(N_local,T_local)*tangent.w;out.worldTangent=(finalWorld*vec4<f32>(T_local,0.0)).xyz;out.worldBitangent=(finalWorld*vec4<f32>(B_local,0.0)).xyz;`;
}
/** Fragment-stage normal perturbation through the interpolated TBN frame. */
function tangentNormalFragment(normalUV, normalScaleMod, normalRef) {
	return `let normalMapRaw=textureSample(normalTexture,normalSampler_,${normalUV}).rgb*2.0-1.0;${normalScaleMod}let normalMapNorm=normalize(${normalRef});var N_geom=normalize(input.worldNormal);let TBN=mat3x3<f32>(input.worldTangent,input.worldBitangent,input.worldNormal);var N=normalize(TBN*normalMapNorm);`;
}
export { tangentFrameVertex, tangentNormalFragment };

//# sourceMappingURL=pbr-normal-tangent-wgsl.js.map