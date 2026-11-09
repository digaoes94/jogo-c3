import { F32, U16 } from "../../engine/typed-arrays.js";
import { BU, SS } from "../../engine/gpu-flags.js";
import { createMappedBuffer } from "../../resource/mapped-buffer.js";
import { createUniformBuffer } from "../../resource/uniform-buffer.js";
import { targetSignatureKey } from "../../engine/render-target-signature.js";
import { createDefaultPipelineDescriptor, getSceneBindGroupLayout } from "../../render/scene-helpers.js";
import { t as SCENE_UBO_WGSL } from "../../_chunks/scene-uniforms-BGiGt-2G.js";
import { createSingleUniformBGL } from "../../shader/bgl-helpers.js";
import { WGSL_DITHER } from "../../shader/wgsl-helpers.js";
import { t as skybox_vertex_default } from "../../_chunks/skybox.vertex-ChJbXel6.js";
// shaders/skybox.fragment.wgsl?raw
var skybox_fragment_default = "struct c{world:mat4x4<f32>,primaryColor:vec3<f32>,_pad:f32,skyOutputColor:vec3<f32>,_pad2:f32}@group(1) @binding(0) var<uniform> mesh:c;struct d{@location(0) positionUVW:vec3<f32>,@location(1) positionW:vec3<f32>}@fragment fn main(b:d)->@location(0) vec4<f32>{var a=vec4<f32>(mesh.skyOutputColor,1.0);a=vec4<f32>(a.rgb+vec3<f32>(dither(b.positionW.xy,0.5)),a.a);a=max(a,vec4<f32>(0.0));return a;}";
// src/material/pbr/background-solid-skybox.ts
/** Solid-color skybox renderable — the clear-color background used by PBR
*  environment scenes when no HDR/DDS skybox is provided.
*
*  Dynamically imported from `background-renderable.ts` so scenes that pass
*  `skipSkybox: true` (or use a dyn-imported HDR/DDS skybox instead) don't
*  pay for the shader module or cube geometry. */
var SKY_MESH_UNIFORM_SIZE = 96;
function createSkyboxBuffers(engine, S) {
	const positions = new F32([
		-S,
		-S,
		-S,
		S,
		-S,
		-S,
		-S,
		S,
		-S,
		S,
		S,
		-S,
		-S,
		-S,
		S,
		S,
		-S,
		S,
		-S,
		S,
		S,
		S,
		S,
		S
	]);
	const indices = new U16([
		6,
		4,
		5,
		7,
		6,
		5,
		0,
		2,
		3,
		1,
		0,
		3,
		5,
		1,
		3,
		7,
		5,
		3,
		0,
		4,
		6,
		2,
		0,
		6,
		3,
		2,
		6,
		7,
		3,
		6,
		0,
		1,
		5,
		4,
		0,
		5
	]);
	return {
		posBuffer: createMappedBuffer(engine, positions, BU.VERTEX),
		idxBuffer: createMappedBuffer(engine, indices, BU.INDEX)
	};
}
var SKYBOX_POS_BUFFER = [{
	arrayStride: 12,
	attributes: [{
		shaderLocation: 0,
		offset: 0,
		format: "float32x3"
	}]
}];
/** Module-global pipeline cache shared by all solid-skybox renderables. */
var _skyPipelines = /* @__PURE__ */ new Map();
var _skyLayout = null;
var _skyCachedDevice = null;
function createSkyboxMaterial() {
	function getLayout(engine) {
		const device = engine._device;
		if (_skyLayout && _skyCachedDevice === device) return _skyLayout;
		_skyLayout = createSingleUniformBGL(engine, "skybox-material", SS.VERTEX | SS.FRAGMENT);
		return _skyLayout;
	}
	return {
		getPipeline(_engine, sig) {
			const device = _engine._device;
			if (_skyCachedDevice !== device) {
				_skyPipelines.clear();
				_skyLayout = null;
				_skyCachedDevice = device;
			}
			const key = targetSignatureKey(sig);
			const cached = _skyPipelines.get(key);
			if (cached) return cached;
			const _vertModule = device.createShaderModule({
				code: SCENE_UBO_WGSL + skybox_vertex_default,
				label: "skybox-vert"
			});
			const _fragModule = device.createShaderModule({
				code: WGSL_DITHER + skybox_fragment_default,
				label: "skybox-frag"
			});
			const pipeline = device.createRenderPipeline(createDefaultPipelineDescriptor({
				_label: "skybox-pipeline",
				_engine,
				_bgls: [getSceneBindGroupLayout(_engine), getLayout(_engine)],
				_vertModule,
				_fragModule,
				_vertexBuffers: SKYBOX_POS_BUFFER,
				_format: sig._colorFormat,
				_depthStencilFormat: sig._depthStencilFormat,
				_depthCompare: sig._depthCompare,
				_msaaSamples: sig._sampleCount,
				_depthWriteEnabled: false
			}));
			_skyPipelines.set(key, pipeline);
			return pipeline;
		},
		createBindGroup(engine, meshUBO, _env) {
			return engine._device.createBindGroup({
				layout: getLayout(engine),
				entries: [{
					binding: 0,
					resource: { buffer: meshUBO }
				}]
			});
		}
	};
}
function buildSolidSkyboxRenderable(scene, envTextures, skyHalfSize, rootPosition, primaryColor) {
	const engine = scene.surface.engine;
	const cc = scene.clearColor;
	const skyBufs = createSkyboxBuffers(engine, skyHalfSize);
	const skyMat = createSkyboxMaterial();
	const skyUBO = createSkyMeshUBO(engine, rootPosition, primaryColor, [
		cc.r,
		cc.g,
		cc.b
	]);
	const skyBG = skyMat.createBindGroup(engine, skyUBO, envTextures);
	const r = {
		order: 0,
		isTransparent: false,
		bind(eng, sig) {
			return {
				renderable: r,
				pipeline: skyMat.getPipeline(eng, sig),
				draw(pass) {
					pass.setBindGroup(1, skyBG);
					pass.setVertexBuffer(0, skyBufs.posBuffer);
					pass.setIndexBuffer(skyBufs.idxBuffer, "uint16");
					pass.drawIndexed(36);
					return 1;
				}
			};
		}
	};
	engine._dlr?.c(r, buildSolidSkyboxRenderable, scene, envTextures, skyHalfSize, rootPosition, primaryColor);
	return r;
}
function createSkyMeshUBO(engine, rootPosition, primaryColor, skyOutputColor) {
	const data = new F32(SKY_MESH_UNIFORM_SIZE / 4);
	data[0] = data[5] = data[10] = data[15] = 1;
	data[12] = rootPosition[0];
	data[13] = rootPosition[1];
	data[14] = rootPosition[2];
	data[16] = primaryColor[0];
	data[17] = primaryColor[1];
	data[18] = primaryColor[2];
	data[20] = skyOutputColor[0];
	data[21] = skyOutputColor[1];
	data[22] = skyOutputColor[2];
	return createUniformBuffer(engine, data);
}
export { buildSolidSkyboxRenderable };

//# sourceMappingURL=background-solid-skybox.js.map