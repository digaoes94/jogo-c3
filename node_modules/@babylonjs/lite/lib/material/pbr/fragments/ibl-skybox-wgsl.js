import { _rightHanded } from "#coordinate-system";
// src/material/pbr/fragments/ibl-skybox-wgsl.ts
var IBL_SKYBOX_CALCULATION = `let R=${_rightHanded ? "(input.worldPos-scene.vEyePosition.xyz)*vec3<f32>(1.0,1.0,-1.0)" : "input.worldPos-scene.vEyePosition.xyz"};let maxLod=f32(textureNumLevels(iblTexture)-1);let cubemapDim=f32(textureDimensions(iblTexture).x);let skyboxAlphaG=max(roughness*roughness,0.000001);var specLod=log2(cubemapDim*skyboxAlphaG)*scene.vImageInfos.z;var environmentRadiance=textureSampleLevel(iblTexture,iblSampler,R,clamp(specLod,0.0,maxLod)).rgb*material.environmentIntensity;let finalSpecularScaled=vec3<f32>(0.0);let finalRadianceScaled=environmentRadiance;color=finalRadianceScaled+emissive;`;
export { IBL_SKYBOX_CALCULATION };

//# sourceMappingURL=ibl-skybox-wgsl.js.map