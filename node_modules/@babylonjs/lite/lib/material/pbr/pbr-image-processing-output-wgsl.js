// src/material/pbr/pbr-image-processing-output-wgsl.ts
/** Exposure also applies when tone mapping is disabled. */
var PBR_EXPOSURE_WGSL = `color*=scene.vImageInfos.x;`;
/** Display conversion shared by ordinary PBR and MeshLoD, after exposure/tone mapping. */
var PBR_DISPLAY_OUTPUT_WGSL = `color=pow(color,vec3<f32>(1.0/2.2));color=clamp(color,vec3<f32>(0.0),vec3<f32>(1.0));let highContrast=color*color*(3.0-2.0*color);if(scene.vImageInfos.y<1.0){color=mix(vec3<f32>(0.5),color,scene.vImageInfos.y);}else{color=mix(color,highContrast,scene.vImageInfos.y-1.0);}color=max(color,vec3<f32>(0.0));`;
export { PBR_DISPLAY_OUTPUT_WGSL, PBR_EXPOSURE_WGSL };

//# sourceMappingURL=pbr-image-processing-output-wgsl.js.map