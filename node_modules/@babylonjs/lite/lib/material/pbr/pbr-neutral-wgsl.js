// src/material/pbr/pbr-neutral-wgsl.ts
var NEUTRAL_HELPERS_WGSL = `const PBRNeutralStartCompression:f32=0.8-0.04;const PBRNeutralDesaturation:f32=0.15;fn PBRNeutralToneMapping(color:vec3<f32>)->vec3<f32>{let x=min(color.r,min(color.g,color.b));let offset=select(0.04,x-6.25*x*x,x<0.08);var result=color-offset;let peak=max(result.r,max(result.g,result.b));if(peak<PBRNeutralStartCompression){return result;}let d=1.0-PBRNeutralStartCompression;let newPeak=1.0-d*d/(peak+d-PBRNeutralStartCompression);result*=newPeak/peak;let g=1.0-1.0/(PBRNeutralDesaturation*(peak-newPeak)+1.0);return mix(result,newPeak*vec3<f32>(1.0,1.0,1.0),g);}`;
var NEUTRAL_TONEMAP_CALL_WGSL = `color*=scene.vImageInfos.x;color=PBRNeutralToneMapping(color);`;
/** Khronos PBR Neutral tone mapping (Babylon.js `TONEMAPPING_KHR_PBR_NEUTRAL`). */
var NeutralToneMapping = {
	id: "neutral",
	helpersWGSL: NEUTRAL_HELPERS_WGSL,
	callWGSL: NEUTRAL_TONEMAP_CALL_WGSL
};
export { NEUTRAL_HELPERS_WGSL, NEUTRAL_TONEMAP_CALL_WGSL, NeutralToneMapping };

//# sourceMappingURL=pbr-neutral-wgsl.js.map