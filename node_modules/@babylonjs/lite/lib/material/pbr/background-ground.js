import { F32, U16, U8 } from "../../engine/typed-arrays.js";
import { BU, SS, TU } from "../../engine/gpu-flags.js";
import { createMappedBuffer } from "../../resource/mapped-buffer.js";
import { getBilinearSampler } from "../../resource/samplers.js";
import { createUniformBuffer } from "../../resource/uniform-buffer.js";
import { targetSignatureKey } from "../../engine/render-target-signature.js";
import { getSceneBindGroupLayout } from "../../render/scene-helpers.js";
import { t as SCENE_UBO_WGSL } from "../../_chunks/scene-uniforms-BGiGt-2G.js";
import { WGSL_DITHER, WGSL_NO_DITHER } from "../../shader/wgsl-helpers.js";
import { _rightHanded } from "#coordinate-system";
// shaders/background.vertex.wgsl?raw
var background_vertex_default = "struct g{world:mat4x4<f32>}@group(1) @binding(0) var<uniform> mesh:g;struct h{@location(0) position:vec3<f32>,@location(1) normal:vec3<f32>,@location(2) uv:vec2<f32>}struct e{@builtin(position) clipPos:vec4<f32>,@location(0) vPositionW:vec3<f32>,@location(1) vNormalW:vec3<f32>,@location(2) vUV:vec2<f32>}@vertex fn main(c:h)->e{var a:e;let b=mesh.world;let d=b*vec4<f32>(c.position,1.0);a.vPositionW=d.xyz;a.clipPos=scene.viewProjection*d;let f=mat3x3<f32>(b[0].xyz,b[1].xyz,b[2].xyz);a.vNormalW=normalize(f*c.normal);a.vUV=c.uv;return a;}";
// shaders/background.ground.fragment.wgsl?raw
var background_ground_fragment_default = "struct o{world:mat4x4<f32>,primaryColor:vec3<f32>,alpha:f32,backgroundCenter:vec3<f32>,_pad:f32}@group(1) @binding(0) var<uniform> mesh:o;@group(1) @binding(1) var n:texture_2d<f32>;@group(1) @binding(2) var m:sampler;struct p{@location(0) vPositionW:vec3<f32>,@location(1) vNormalW:vec3<f32>,@location(2) vUV:vec2<f32>}@fragment fn main(b:p)->@location(0) vec4<f32>{let g=normalize(b.vNormalW);let c=textureSample(n,m,b.vUV);let h=c.rgb;let f=max(h,vec3<f32>(0.0));let i=mesh.primaryColor;let j=f*i;var e=mesh.alpha*c.a;let k=dot(g,normalize(scene.vEyePosition.xyz-mesh.backgroundCenter));const l:f32=0.1;let d=clamp(k/l,0.0,1.0);e*=d*d;var a=vec4<f32>(j,e);if (scene.vImageInfos.w>=0.0){a=applyImageProcessing(a);}a=vec4<f32>(a.rgb*a.a,a.a);a=vec4<f32>(a.rgb+vec3<f32>(dither(b.vPositionW.xy,0.5)),a.a);a=max(a,vec4<f32>(0.0));return a;}";
// src/material/pbr/background-ground.ts
/** Ground plane renderable — lazy-loaded only when a scene includes a ground.
*  Contains the ground material, mesh buffers, texture loading, and UBO creation.
*  Tree-shaken away from scenes that use `skipGround: true`. */
/** Image processing: exposure → Reinhard tonemap → gamma → contrast. */
var WGSL_IMAGE_PROCESSING = `fn applyImageProcessing(result:vec4<f32>)->vec4<f32>{var rgb=result.rgb;rgb*=scene.vImageInfos.x;const tonemappingCalibration:f32=1.590579;rgb=1.0-exp2(-tonemappingCalibration*rgb);rgb=pow(rgb,vec3<f32>(1.0/2.2));rgb=clamp(rgb,vec3<f32>(0.0),vec3<f32>(1.0));let highContrast=rgb*rgb*(3.0-2.0*rgb);if(scene.vImageInfos.y<1.0){rgb=mix(vec3<f32>(0.5),rgb,scene.vImageInfos.y);}else{rgb=mix(rgb,highContrast,scene.vImageInfos.y-1.0);}rgb=max(rgb,vec3<f32>(0.0));return vec4<f32>(rgb,result.a);}`;
var BG_MESH_UNIFORM_SIZE = 96;
/** Build the ground renderable for a PBR environment scene. */
async function buildGroundRenderable(engine, groundSize, rootPosition, primaryColor, groundTextureUrl, groundImagePromise, enableNoise = true) {
	const gndMat = createGroundMaterial(enableNoise, SCENE_UBO_WGSL + WGSL_IMAGE_PROCESSING + (enableNoise ? WGSL_DITHER : WGSL_NO_DITHER) + background_ground_fragment_default);
	const gndBufs = createGroundBuffers(engine, groundSize);
	const gndUBO = createBgMeshUBO(engine, rootPosition, primaryColor);
	const groundTexView = (await loadGroundTexture(engine, groundTextureUrl, groundImagePromise)).createView();
	const groundSamp = getBilinearSampler(engine);
	const gndBG = gndMat.createBindGroup(engine, gndUBO, groundTexView, groundSamp);
	const r = {
		order: 200,
		isTransparent: true,
		bind(eng, sig) {
			return {
				renderable: r,
				pipeline: gndMat.getPipeline(eng, sig),
				draw(pass) {
					pass.setBindGroup(1, gndBG);
					pass.setVertexBuffer(0, gndBufs.posBuffer);
					pass.setVertexBuffer(1, gndBufs.normBuffer);
					pass.setVertexBuffer(2, gndBufs.uvBuffer);
					pass.setIndexBuffer(gndBufs.idxBuffer, "uint16");
					pass.drawIndexed(6);
					return 1;
				}
			};
		}
	};
	engine._dlr?.c(r, buildGroundRenderable, engine, groundSize, rootPosition, primaryColor, groundTextureUrl, void 0, enableNoise);
	return r;
}
/** Module-global pipeline cache — keyed by noise mode + full target signature (color/depth/samples/flipY).
*  All ground renderables share this cache. */
var _gndPipelines = /* @__PURE__ */ new Map();
var _gndLayout = null;
var _gndCachedDevice = null;
function createGroundMaterial(enableNoise, fragCode) {
	function getLayout(engine) {
		const device = engine._device;
		if (_gndLayout && _gndCachedDevice === device) return _gndLayout;
		_gndLayout = device.createBindGroupLayout({
			label: "ground-material",
			entries: [
				{
					binding: 0,
					visibility: SS.VERTEX | SS.FRAGMENT,
					buffer: { type: "uniform" }
				},
				{
					binding: 1,
					visibility: SS.FRAGMENT,
					texture: {
						sampleType: "float",
						viewDimension: "2d"
					}
				},
				{
					binding: 2,
					visibility: SS.FRAGMENT,
					sampler: { type: "filtering" }
				}
			]
		});
		_gndCachedDevice = device;
		return _gndLayout;
	}
	return {
		getPipeline(engine, sig) {
			const device = engine._device;
			if (_gndCachedDevice !== device) {
				_gndPipelines.clear();
				_gndLayout = null;
				_gndCachedDevice = device;
			}
			const key = `${+enableNoise}|${targetSignatureKey(sig)}`;
			const cached = _gndPipelines.get(key);
			if (cached) return cached;
			const vertModule = device.createShaderModule({
				code: SCENE_UBO_WGSL + background_vertex_default,
				label: "ground-vert"
			});
			const fragModule = device.createShaderModule({
				code: fragCode,
				label: "ground-frag"
			});
			const pipeline = device.createRenderPipeline({
				label: "ground-pipeline",
				layout: device.createPipelineLayout({ bindGroupLayouts: [getSceneBindGroupLayout(engine), getLayout(engine)] }),
				vertex: {
					module: vertModule,
					entryPoint: "main",
					buffers: [
						{
							arrayStride: 12,
							attributes: [{
								shaderLocation: 0,
								offset: 0,
								format: "float32x3"
							}]
						},
						{
							arrayStride: 12,
							attributes: [{
								shaderLocation: 1,
								offset: 0,
								format: "float32x3"
							}]
						},
						{
							arrayStride: 8,
							attributes: [{
								shaderLocation: 2,
								offset: 0,
								format: "float32x2"
							}]
						}
					]
				},
				fragment: {
					module: fragModule,
					entryPoint: "main",
					targets: [{
						format: sig._colorFormat,
						blend: {
							color: {
								srcFactor: "one",
								dstFactor: "one-minus-src-alpha",
								operation: "add"
							},
							alpha: {
								srcFactor: "one",
								dstFactor: "one-minus-src-alpha",
								operation: "add"
							}
						}
					}]
				},
				depthStencil: {
					format: sig._depthStencilFormat ?? "depth24plus-stencil8",
					depthCompare: sig._depthCompare ?? "greater-equal",
					depthWriteEnabled: false
				},
				multisample: { count: sig._sampleCount },
				primitive: {
					topology: "triangle-list",
					cullMode: "back",
					frontFace: _rightHanded ? "cw" : "ccw"
				}
			});
			_gndPipelines.set(key, pipeline);
			return pipeline;
		},
		createBindGroup(engine, meshUBO, groundTextureView, groundSampler) {
			return engine._device.createBindGroup({
				layout: getLayout(engine),
				entries: [
					{
						binding: 0,
						resource: { buffer: meshUBO }
					},
					{
						binding: 1,
						resource: groundTextureView
					},
					{
						binding: 2,
						resource: groundSampler
					}
				]
			});
		}
	};
}
/** Ground quad (4 verts, 6 indices — matches BJS CreatePlane with BACKSIDE).
*  XY plane, normals +Z (become +Y after world rotation). */
function createGroundBuffers(engine, groundSize) {
	const h = groundSize / 2;
	const positions = new F32([
		-h,
		-h,
		0,
		h,
		-h,
		0,
		h,
		h,
		0,
		-h,
		h,
		0
	]);
	const normals = new F32([
		0,
		0,
		1,
		0,
		0,
		1,
		0,
		0,
		1,
		0,
		0,
		1
	]);
	const uvs = new F32([
		0,
		0,
		1,
		0,
		1,
		1,
		0,
		1
	]);
	const indices = new U16([
		0,
		2,
		1,
		0,
		3,
		2
	]);
	return {
		posBuffer: createMappedBuffer(engine, positions, BU.VERTEX),
		normBuffer: createMappedBuffer(engine, normals, BU.VERTEX),
		uvBuffer: createMappedBuffer(engine, uvs, BU.VERTEX),
		idxBuffer: createMappedBuffer(engine, indices, BU.INDEX)
	};
}
function createBgMeshUBO(engine, rootPosition, primaryColor) {
	const data = new F32(BG_MESH_UNIFORM_SIZE / 4);
	const eps = 2220446049250313e-31;
	data[0] = data[15] = 1;
	data[5] = data[10] = eps;
	data[6] = -1;
	data[9] = 1;
	data[12] = rootPosition[0];
	data[13] = rootPosition[1];
	data[14] = rootPosition[2];
	data[16] = primaryColor[0];
	data[17] = primaryColor[1];
	data[18] = primaryColor[2];
	data[19] = .9;
	data[20] = 0;
	data[21] = 0;
	data[22] = 0;
	return createUniformBuffer(engine, data);
}
/** Load a ground diffuse texture from URL and upload to GPU.
*  Falls back to a 1×1 white pixel if no URL provided. */
async function loadGroundTexture(engine, url, preloadedImage) {
	const device = engine._device;
	if (!url) {
		const tex = device.createTexture({
			size: [1, 1],
			format: "rgba8unorm",
			usage: TU.TEXTURE_BINDING | TU.COPY_DST
		});
		device.queue.writeTexture({ texture: tex }, new U8([
			255,
			255,
			255,
			255
		]), { bytesPerRow: 4 }, [1, 1]);
		return tex;
	}
	const bmp = preloadedImage ? await preloadedImage : await fetch(url).then((r) => r.blob()).then((b) => createImageBitmap(b, { premultiplyAlpha: "none" }));
	const tex = device.createTexture({
		size: [bmp.width, bmp.height],
		format: "rgba8unorm",
		usage: TU.TEXTURE_BINDING | TU.COPY_DST | TU.RENDER_ATTACHMENT
	});
	device.queue.copyExternalImageToTexture({ source: bmp }, { texture: tex }, [bmp.width, bmp.height]);
	bmp.close();
	return tex;
}
export { buildGroundRenderable };

//# sourceMappingURL=background-ground.js.map