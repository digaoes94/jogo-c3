import { F32 } from "../../engine/typed-arrays.js";
import { createUniformBuffer } from "../../resource/uniform-buffer.js";
import { t as SCENE_UBO_WGSL } from "../../_chunks/scene-uniforms-BGiGt-2G.js";
import { composeSkyboxFragment, createCubemapSkyboxMaterial, createCubemapSkyboxRenderable, createSkyboxBuffers } from "./cubemap-skybox-material.js";
import { t as skybox_vertex_default } from "../../_chunks/skybox.vertex-ChJbXel6.js";
// shaders/skybox-hdr.fragment.wgsl?raw
var skybox_hdr_fragment_default = "struct g{world:mat4x4<f32>,primaryColor:vec3<f32>,_pad:f32,skyOutputColor:vec3<f32>,_pad2:f32,exposureLinear:f32,contrast:f32,_pad3:f32,_pad4:f32}@group(1) @binding(0) var<uniform> mesh:g;@group(1) @binding(1) var b:texture_cube<f32>;@group(1) @binding(2) var c:sampler;struct h{@location(0) positionUVW:vec3<f32>,@location(1) positionW:vec3<f32>}@fragment fn main(d:h)->@location(0) vec4<f32>{var e=normalize(d.positionUVW);var a=textureSampleLevel(b,c,e,0.0).rgb;a*=mesh.exposureLinear;a=pow(a,vec3<f32>(1.0/2.2));a=clamp(a,vec3<f32>(0.0),vec3<f32>(1.0));let f=a*a*(3.0-2.0*a);if (mesh.contrast<1.0){a=mix(vec3<f32>(0.5),a,mesh.contrast);} else{a=mix(a,f,mesh.contrast-1.0);}a=max(a,vec3<f32>(0.0));return vec4<f32>(a,1.0);}";
// src/material/pbr/background-hdr-skybox.ts
/** HDR cubemap skybox — lazy-loaded only when useCubemapSkybox is true.
*  Contains the HDR skybox shader wiring and UBO; cube geometry and the Renderable
*  shell are shared with the DDS skybox via cubemap-skybox-material.
*  Self-contained: computes scene bounds and builds a full Renderable.
*  Tree-shaken away from scenes that use the default solid-color skybox. */
var SKY_HDR_UNIFORM_SIZE = 112;
/** Build an HDR cubemap skybox as a complete Renderable (order 0). */
async function buildHdrSkyboxRenderable(scene, envTextures, skyHalfSize, rootPosition, primaryColor) {
	const engine = scene.surface.engine;
	const [positionBuffer, indexBuffer] = createSkyboxBuffers(engine, skyHalfSize);
	const skyboxFragment = await composeSkyboxFragment(scene, skybox_hdr_fragment_default, "hdr");
	const mat = createCubemapSkyboxMaterial("skybox-hdr", SCENE_UBO_WGSL + skybox_vertex_default, skyboxFragment);
	const ubo = createSkyHdrMeshUBO(engine, rootPosition, primaryColor, scene.clearColor, scene.imageProcessing.exposure, scene.imageProcessing.contrast);
	const bindGroup = mat.createBindGroup(engine, ubo, envTextures.specularCubeView, envTextures.cubeSampler);
	const renderable = createCubemapSkyboxRenderable(mat, bindGroup, positionBuffer, indexBuffer);
	engine._dlr?.c(renderable, buildHdrSkyboxRenderable, scene, envTextures, skyHalfSize, rootPosition, primaryColor);
	return renderable;
}
function createSkyHdrMeshUBO(engine, rootPosition, primaryColor, skyOutputColor, exposure, contrast) {
	const data = new F32(SKY_HDR_UNIFORM_SIZE / 4);
	data[0] = data[5] = data[10] = data[15] = 1;
	data[12] = rootPosition[0];
	data[13] = rootPosition[1];
	data[14] = rootPosition[2];
	data[16] = primaryColor[0];
	data[17] = primaryColor[1];
	data[18] = primaryColor[2];
	data[20] = skyOutputColor.r;
	data[21] = skyOutputColor.g;
	data[22] = skyOutputColor.b;
	data[24] = exposure;
	data[25] = contrast;
	return createUniformBuffer(engine, data);
}
export { buildHdrSkyboxRenderable };

//# sourceMappingURL=background-hdr-skybox.js.map