import { F32, I32, U8 } from "../engine/typed-arrays.js";
import { TU } from "../engine/gpu-flags.js";
import { getOrCreateSampler } from "../resource/texture-sampler-pool.js";
import { createUniformBuffer } from "../resource/uniform-buffer.js";
import { t as SCENE_UBO_WGSL } from "./scene-uniforms-BGiGt-2G.js";
import { WGSL_DITHER, WGSL_NO_DITHER } from "../shader/wgsl-helpers.js";
import { composeSkyboxFragment, createCubemapSkyboxMaterial, createCubemapSkyboxRenderable, createSkyboxBuffers } from "../material/pbr/cubemap-skybox-material.js";
// shaders/skybox-dds.vertex.wgsl?raw
var skybox_dds_vertex_default = "struct e{world:mat4x4<f32>}@group(1) @binding(0) var<uniform> mesh:e;struct d{@builtin(position) clipPos:vec4<f32>,@location(0) positionUVW:vec3<f32>,@location(1) positionW:vec3<f32>}@vertex fn main(@location(0) b:vec3<f32>)->d{var a:d;a.positionUVW=b;let c=(mesh.world*vec4<f32>(b,1.0)).xyz;a.positionW=c;a.clipPos=scene.viewProjection*vec4<f32>(c,1.0);return a;}";
// shaders/skybox-dds.fragment.wgsl?raw
var skybox_dds_fragment_default = "struct g{world:mat4x4<f32>,primaryColor:vec3<f32>,exposureLinear:f32,contrast:f32,_pad1:f32,_pad2:f32,_pad3:f32}@group(1) @binding(0) var<uniform> mesh:g;@group(1) @binding(1) var c:texture_cube<f32>;@group(1) @binding(2) var d:sampler;struct h{@location(0) positionUVW:vec3<f32>,@location(1) positionW:vec3<f32>}@fragment fn main(b:h)->@location(0) vec4<f32>{var e=normalize(b.positionUVW);var a=textureSampleLevel(c,d,e,0.0).rgb;a*=mesh.primaryColor;if (scene.vImageInfos.w>=0.0){a*=mesh.exposureLinear;a=1.0-exp2(-1.590579*a);a=pow(a,vec3<f32>(1.0/2.2));a=saturate(a);let f=a*a*(3.0-2.0*a);a=mix(a,f,mesh.contrast-1.0);a=a+vec3<f32>(dither(b.positionW.xy,0.5));a=max(a,vec3<f32>(0.0));}return vec4<f32>(a,1.0);}";
// src/material/pbr/background-dds-skybox.ts
/** DDS cube skybox — lazy-loaded only when skyboxUrl ends with .dds.
*  Loads backgroundSkybox.dds and renders it with BJS image processing. */
var SKY_DDS_UNIFORM_SIZE = 96;
var DEFAULT_SKY_URL = "https://assets.babylonjs.com/core/environments/backgroundSkybox.dds";
/** Build a DDS cube skybox as a complete Renderable (order 0). */
async function buildDdsSkyboxRenderable(scene, skyHalfSize, rootPosition, primaryColor, skyboxTextureUrl, enableNoise = true) {
	const engine = scene.surface.engine;
	const [positionBuffer, indexBuffer] = createSkyboxBuffers(engine, skyHalfSize);
	const { cubeView, sampler } = await loadDdsCube(engine, skyboxTextureUrl ?? DEFAULT_SKY_URL);
	const skyboxFragment = await composeSkyboxFragment(scene, skybox_dds_fragment_default, "dds");
	const fragCode = SCENE_UBO_WGSL + (enableNoise ? WGSL_DITHER : WGSL_NO_DITHER) + skyboxFragment;
	const mat = createCubemapSkyboxMaterial(enableNoise ? "skybox-dds" : "skybox-dds0", SCENE_UBO_WGSL + skybox_dds_vertex_default, fragCode);
	const ubo = createDdsMeshUBO(engine, rootPosition, primaryColor, scene.imageProcessing.exposure, scene.imageProcessing.contrast);
	const bindGroup = mat.createBindGroup(engine, ubo, cubeView, sampler);
	const renderable = createCubemapSkyboxRenderable(mat, bindGroup, positionBuffer, indexBuffer);
	engine._dlr?.c(renderable, buildDdsSkyboxRenderable, scene, skyHalfSize, rootPosition, primaryColor, skyboxTextureUrl, enableNoise);
	return renderable;
}
function createDdsMeshUBO(engine, rootPosition, primaryColor, exposureLinear, contrast) {
	const data = new F32(SKY_DDS_UNIFORM_SIZE / 4);
	data[0] = data[5] = data[10] = data[15] = 1;
	data[12] = rootPosition[0];
	data[13] = rootPosition[1];
	data[14] = rootPosition[2];
	data[16] = primaryColor[0];
	data[17] = primaryColor[1];
	data[18] = primaryColor[2];
	data[19] = exposureLinear;
	data[20] = contrast;
	return createUniformBuffer(engine, data);
}
/** Load a DDS cube texture (rgba16float) and return a cube texture view + sampler.
*  Uploads only mip 0 from the DDS file and generates remaining mipmaps on the
*  GPU so that cube face edges blend seamlessly — matching BJS's behaviour. */
async function loadDdsCube(engine, url) {
	const device = engine._device;
	const buf = await (await fetch(url)).arrayBuffer();
	const header = new I32(buf, 0, 32);
	const width = header[3];
	const mipCount = Math.max(header[7], 1);
	const dataOffset = header[21] === 808540228 ? 148 : 128;
	const raw = new U8(buf, dataOffset);
	const tex = device.createTexture({
		size: [
			width,
			width,
			6
		],
		format: "rgba16float",
		mipLevelCount: mipCount,
		usage: TU.TEXTURE_BINDING | TU.COPY_DST | TU.RENDER_ATTACHMENT
	});
	let offset = 0;
	for (let face = 0; face < 6; face++) for (let m = 0; m < mipCount; m++) {
		const s = Math.max(width >> m, 1);
		device.queue.writeTexture({
			texture: tex,
			origin: {
				x: 0,
				y: 0,
				z: face
			},
			mipLevel: m
		}, raw.buffer, {
			offset: raw.byteOffset + offset,
			bytesPerRow: s * 8
		}, {
			width: s,
			height: s
		});
		offset += s * s * 8;
	}
	return {
		cubeView: tex.createView({ dimension: "cube" }),
		sampler: getOrCreateSampler(engine, {
			magFilter: "linear",
			minFilter: "linear",
			mipmapFilter: "linear",
			addressModeU: "clamp-to-edge",
			addressModeV: "clamp-to-edge",
			addressModeW: "clamp-to-edge",
			maxAnisotropy: 4
		})
	};
}
export { buildDdsSkyboxRenderable as t };

//# sourceMappingURL=background-dds-skybox-COnEpRpX.js.map