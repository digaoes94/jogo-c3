import { SS } from "../engine/gpu-flags.js";
import { createUniformBuffer } from "../resource/uniform-buffer.js";
import { targetSignatureKey } from "../engine/render-target-signature.js";
import { createDefaultPipelineDescriptor, getSceneBindGroupLayout } from "../render/scene-helpers.js";
import { t as SCENE_UBO_WGSL } from "./scene-uniforms-BGiGt-2G.js";
import { WGSL_FOG } from "../shader/wgsl-fog.js";
import { _rightHanded } from "#coordinate-system";
// shaders/skybox-cubemap.vertex.wgsl?raw
var skybox_cubemap_vertex_default = "struct e{world:mat4x4<f32>}@group(1) @binding(0) var<uniform> mesh:e;struct d{@builtin(position) clipPos:vec4<f32>,@location(0) vPositionW:vec3<f32>,@location(1) vPositionLocal:vec3<f32>,@location(2) vFogDistance:vec3<f32>}@vertex fn main(@location(0) c:vec3<f32>,@location(1) normal:vec3<f32>)->d{var a:d;let b=mesh.world*vec4<f32>(c,1.0);a.vPositionW=b.xyz;a.vPositionLocal=c;a.clipPos=scene.viewProjection*b;a.vFogDistance=(scene.view*b).xyz;return a;}";
// shaders/skybox-cubemap.fragment.wgsl?raw
var skybox_cubemap_fragment_default = "@group(1) @binding(1) var c:texture_cube<f32>;@group(1) @binding(2) var d:sampler;struct g{@location(0) vPositionW:vec3<f32>,@location(1) vPositionLocal:vec3<f32>,@location(2) vFogDistance:vec3<f32>}@fragment fn main(b:g)->@location(0) vec4<f32>{let e=normalize(b.vPositionLocal);var a=textureSample(c,d,e);if (scene.vFogInfos.x>0.0){let f=calcFogFactor(b.vFogDistance);a=vec4<f32>(mix(scene.vFogColor.rgb,a.rgb,f),a.a);}return a;}";
// src/material/standard/skybox-cubemap.ts
/**
* Skybox CubeMap Material — renders a cube map on the inside of a box.
* Material owns shaders (pillar 4c). Self-contained pipeline and bind groups.
*
* Used for StandardMaterial + CubeTexture(SKYBOX_MODE) in Babylon.
* Renders backfaces (no culling → sees inside of box).
*/
/**
* Build the per-skybox GPU resources (mesh BGL + bind group + UBO + shader modules
* + pipeline cache). The pipeline is created lazily by `getPipeline(engine, sig)`
* once the target sig is known. The scene bind group is supplied per-pass by the
* active RenderTask.
*/
function buildSkyboxCubeMapGPU(engine, worldMatrix, cubeView, cubeSampler) {
	const device = engine._device;
	const meshBindGroupLayout = device.createBindGroupLayout({
		label: "skybox-cm-mesh",
		entries: [
			{
				binding: 0,
				visibility: SS.VERTEX,
				buffer: { type: "uniform" }
			},
			{
				binding: 1,
				visibility: SS.FRAGMENT,
				texture: {
					sampleType: "float",
					viewDimension: "cube"
				}
			},
			{
				binding: 2,
				visibility: SS.FRAGMENT,
				sampler: {}
			}
		]
	});
	const meshUBO = createUniformBuffer(engine, worldMatrix);
	const gpu = {
		getPipeline(_engine, sig) {
			const key = targetSignatureKey(sig);
			const cached = gpu.pipelines.get(key);
			if (cached) return cached;
			const pipeline = _engine._device.createRenderPipeline(createDefaultPipelineDescriptor({
				_label: "skybox-cubemap-pipeline",
				_engine,
				_bgls: [getSceneBindGroupLayout(_engine), gpu.meshBindGroupLayout],
				_vertModule: gpu.vertModule,
				_fragModule: gpu.fragModule,
				_vertexBuffers: [{
					arrayStride: 12,
					attributes: [{
						shaderLocation: 0,
						offset: 0,
						format: "float32x3"
					}]
				}, {
					arrayStride: 12,
					attributes: [{
						shaderLocation: 1,
						offset: 0,
						format: "float32x3"
					}]
				}],
				_format: sig._colorFormat,
				_depthStencilFormat: sig._depthStencilFormat,
				_depthCompare: sig._depthCompare,
				_msaaSamples: sig._sampleCount,
				_cullMode: "none"
			}));
			gpu.pipelines.set(key, pipeline);
			return pipeline;
		},
		meshBindGroup: device.createBindGroup({
			layout: meshBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: meshUBO }
				},
				{
					binding: 1,
					resource: cubeView
				},
				{
					binding: 2,
					resource: cubeSampler
				}
			]
		}),
		meshUBO,
		meshBindGroupLayout,
		vertModule: device.createShaderModule({
			code: SCENE_UBO_WGSL + skybox_cubemap_vertex_default,
			label: "skybox-cm-vert"
		}),
		fragModule: device.createShaderModule({
			code: SCENE_UBO_WGSL + WGSL_FOG + (_rightHanded ? skybox_cubemap_fragment_default.replace("vPositionLocal)", "vPositionLocal)*vec3f(1.,1.,-1.)") : skybox_cubemap_fragment_default),
			label: "skybox-cm-frag"
		}),
		pipelines: /* @__PURE__ */ new Map()
	};
	return gpu;
}
export { buildSkyboxCubeMapGPU as t };

//# sourceMappingURL=skybox-cubemap-C-xU6hSy.js.map