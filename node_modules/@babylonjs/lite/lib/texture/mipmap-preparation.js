import { SS } from "../engine/gpu-flags.js";
import { getBilinearSampler } from "../resource/samplers.js";
// src/texture/mipmap-preparation.ts
var BLIT_SHADER = `@group(0)@binding(0)var t:texture_2d<f32>;@group(0)@binding(1)var s:sampler;struct V{@builtin(position)p:vec4f,@location(0)u:vec2f};@vertex fn vs(@builtin(vertex_index)i:u32)->V{let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3))[i];return V(vec4f(p,0,1),p*vec2f(.5,-.5)+.5);}@fragment fn fs(v:V)->@location(0)vec4f{return textureSample(t,s,v.u);}`;
var pipelineCache = null;
var shaderModule = null;
var linearSampler = null;
var bindGroupLayout = null;
var cachedDevice = null;
function ensureResources(engine) {
	const device = engine._device;
	if (device !== cachedDevice) {
		pipelineCache?.clear();
		pipelineCache = null;
		shaderModule = null;
		linearSampler = null;
		bindGroupLayout = null;
		cachedDevice = device;
	}
	shaderModule ??= device.createShaderModule({ code: BLIT_SHADER });
	linearSampler ??= getBilinearSampler(engine);
	bindGroupLayout ??= device.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: SS.FRAGMENT,
		texture: { sampleType: "float" }
	}, {
		binding: 1,
		visibility: SS.FRAGMENT,
		sampler: {}
	}] });
}
function getPipeline(engine, format) {
	ensureResources(engine);
	const cache = pipelineCache ??= /* @__PURE__ */ new Map();
	let pipeline = cache.get(format);
	if (!pipeline) {
		const device = engine._device;
		pipeline = device.createRenderPipeline({
			layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
			vertex: {
				module: shaderModule,
				entryPoint: "vs"
			},
			fragment: {
				module: shaderModule,
				entryPoint: "fs",
				targets: [{ format }]
			},
			primitive: { topology: "triangle-list" }
		});
		cache.set(format, pipeline);
	}
	return pipeline;
}
/** Prebuild views, bind groups, and render-pass descriptors for repeated mip regeneration. */
function prepareMipmaps(engine, texture, face) {
	if (texture.mipLevelCount <= 1) return [];
	const device = engine._device;
	const pipeline = getPipeline(engine, texture.format);
	const prepared = [];
	const viewOptions = face === void 0 ? {} : {
		dimension: "2d",
		baseArrayLayer: face,
		arrayLayerCount: 1
	};
	for (let mip = 1; mip < texture.mipLevelCount; mip++) {
		const bindGroup = device.createBindGroup({
			layout: bindGroupLayout,
			entries: [{
				binding: 0,
				resource: texture.createView({
					baseMipLevel: mip - 1,
					mipLevelCount: 1,
					...viewOptions
				})
			}, {
				binding: 1,
				resource: linearSampler
			}]
		});
		prepared.push({
			pipeline,
			bindGroup,
			descriptor: { colorAttachments: [{
				view: texture.createView({
					baseMipLevel: mip,
					mipLevelCount: 1,
					...viewOptions
				}),
				loadOp: "clear",
				storeOp: "store",
				clearValue: {
					r: 0,
					g: 0,
					b: 0,
					a: 0
				}
			}] }
		});
	}
	return prepared;
}
/** Record a prepared mip chain without per-frame GPU object creation. */
function recordPreparedMipmaps(encoder, prepared) {
	for (const level of prepared) {
		const pass = encoder.beginRenderPass(level.descriptor);
		pass.setPipeline(level.pipeline);
		pass.setBindGroup(0, level.bindGroup);
		pass.draw(3);
		pass.end();
	}
}
export { prepareMipmaps, recordPreparedMipmaps };

//# sourceMappingURL=mipmap-preparation.js.map