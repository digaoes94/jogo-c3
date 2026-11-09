import { TU } from "../engine/gpu-flags.js";
// src/loader-gltf/ibl-cubemap-upload.ts
/** RGBD cubemap uploader for EXT_lights_image_based.
*
*  A self-contained copy of the RGBD `->` rgba16float cubemap decode used by the
*  image-based-lights extension. It is intentionally NOT shared with
*  `loader-env/rgbd-decode.ts`: that module is a static dependency of the `.env`
*  loader (`load-env.ts`) and is therefore inlined into every environment scene's
*  chunk graph. Importing `uploadCubemapRGBD` from it would make the extension a
*  second consumer of that shared module, pinning the (otherwise tree-shaken)
*  cubemap path into every `.env`/DDS scene's bundle. Keeping a private copy here
*  — reachable only from this lazily-imported feature chunk — means non-IBL scenes
*  pay zero bytes for it and only `EXT_lights_image_based` scenes fetch it. */
/** Numeric ID keeps JS property minifiers from renaming the descriptor key independently of the WGSL. */
var FLIP_Y_CONSTANT_ID = 0;
var WGSL = `@id(${FLIP_Y_CONSTANT_ID})override f:bool=false;@group(0)@binding(0)var t:texture_2d<f32>;@group(0)@binding(1)var o:texture_storage_2d<rgba16float,write>;@compute@workgroup_size(8,8)fn main(@builtin(global_invocation_id)g:vec3u){let d=textureDimensions(t);if(any(g.xy>=d)){return;}let c=textureLoad(t,vec2u(g.x,select(g.y,d.y-1u-g.y,f)),0);textureStore(o,g.xy,vec4f(pow(c.rgb,vec3f(2.2))/max(c.a,1.0/255.0),1));}`;
var _device = null;
var _module = null;
var _pipeline = null;
function getPipeline(device) {
	if (device !== _device) {
		_device = device;
		_module = device.createShaderModule({ code: WGSL });
		_pipeline = null;
	}
	if (_pipeline) return _pipeline;
	_pipeline = device.createComputePipeline({
		layout: "auto",
		compute: {
			module: _module,
			entryPoint: "main",
			constants: { [FLIP_Y_CONSTANT_ID]: 1 }
		}
	});
	return _pipeline;
}
/** Decode and upload a RGBD cubemap (6 faces × N mips) → rgba16float cube texture.
*  Y-flipped on read (BJS uploads cubemap faces with invertY=true). */
function uploadCubemapRGBD(engine, images, width, mipCount) {
	const device = engine._device;
	const pipeline = getPipeline(device);
	const texture = device.createTexture({
		size: {
			width,
			height: width,
			depthOrArrayLayers: 6
		},
		format: "rgba16float",
		mipLevelCount: mipCount,
		usage: TU.TEXTURE_BINDING | TU.COPY_DST | TU.COPY_SRC | TU.RENDER_ATTACHMENT,
		dimension: "2d"
	});
	for (let mip = 0; mip < mipCount; mip++) {
		const mipSize = Math.max(1, width >> mip);
		const inputTex = device.createTexture({
			size: {
				width: mipSize,
				height: mipSize
			},
			format: "rgba8unorm",
			usage: TU.TEXTURE_BINDING | TU.COPY_DST | TU.RENDER_ATTACHMENT
		});
		const outputTex = device.createTexture({
			size: {
				width: mipSize,
				height: mipSize
			},
			format: "rgba16float",
			usage: TU.STORAGE_BINDING | TU.COPY_SRC
		});
		const bindGroup = device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [{
				binding: 0,
				resource: inputTex.createView()
			}, {
				binding: 1,
				resource: outputTex.createView()
			}]
		});
		for (let face = 0; face < 6; face++) {
			const idx = mip * 6 + face;
			if (idx >= images.length) break;
			device.queue.copyExternalImageToTexture({
				source: images[idx],
				flipY: false
			}, {
				texture: inputTex,
				premultipliedAlpha: false
			}, {
				width: mipSize,
				height: mipSize
			});
			const encoder = device.createCommandEncoder();
			const pass = encoder.beginComputePass();
			pass.setPipeline(pipeline);
			pass.setBindGroup(0, bindGroup);
			pass.dispatchWorkgroups(Math.ceil(mipSize / 8), Math.ceil(mipSize / 8));
			pass.end();
			encoder.copyTextureToTexture({ texture: outputTex }, {
				texture,
				origin: {
					x: 0,
					y: 0,
					z: face
				},
				mipLevel: mip
			}, {
				width: mipSize,
				height: mipSize
			});
			device.queue.submit([encoder.finish()]);
		}
		inputTex.destroy();
		outputTex.destroy();
	}
	return texture;
}
export { uploadCubemapRGBD };

//# sourceMappingURL=ibl-cubemap-upload.js.map