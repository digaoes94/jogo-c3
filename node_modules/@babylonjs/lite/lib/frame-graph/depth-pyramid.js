import { SS, TU } from "../engine/gpu-flags.js";
import { acquireTexture } from "../resource/texture-acquire.js";
import { releaseTexture } from "../resource/texture-release.js";
import { getOrCreateSampler } from "../resource/texture-sampler-pool.js";
// src/frame-graph/depth-pyramid.ts
/**
* Depth pyramid — a hierarchical ("Hi-Z") mip chain of a depth buffer where each coarser level combines its
* four child texels with `min()` or `max()`. The classic uses are GPU occlusion culling (test a screen-space
* bounding box against the coarse level that covers it) and hierarchical screen-space ray marching (skip empty
* space at coarse mips, refine to a precise hit at level 0), plus horizon-search AO and contact shadows.
*
* WebGPU has no built-in min/max mip reduction, so — like `generate-mipmaps` — we render a fullscreen triangle
* per level. Two pipelines:
*   • COPY:   sample the source `texture_depth_2d` → write its NDC depth into mip 0 of an `r32float` texture.
*   • REDUCE: each coarser level = `min`/`max` of its four child texels of the previous level.
*
* The `reduce` mode is the caller's choice of depth convention + use: a reverse-Z Hi-Z (near = 1) wants `max`
* (keeps the NEAREST surface per tile — what a skip-empty ray march needs); a farthest-occluder pyramid for
* occlusion culling wants `min` in reverse-Z (the deepest occluder is the conservative bound). Nearest sampler,
* so the consumer reads it with `textureLoad(tex, coord, mip)`.
*
* The output `Texture2D` ref-counts through the shared texture pool: the pyramid holds one base ref so a
* consumer material's bind/rebind churn can never drive it to zero. `resize()` mints a FRESH wrapper (new
* identity) so the consumer's `setShaderTexture` sees the change and rebuilds its bind group against the new
* view; the old texture stays alive until the consumer releases its own ref (no destroy-while-referenced).
*/
/** Full mip chain length for a width/height (log2 of the larger side + 1). */
function mipLevelCount(width, height) {
	return Math.floor(Math.log2(Math.max(width, height))) + 1;
}
var COPY_SHADER = `@group(0)@binding(0)var src:texture_depth_2d;struct V{@builtin(position)p:vec4f};@vertex fn vs(@builtin(vertex_index)i:u32)->V{let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3))[i];return V(vec4f(p,0,1));}@fragment fn fs(@builtin(position)fc:vec4f)->@location(0)f32{return textureLoad(src,vec2<i32>(fc.xy),0);}`;
/** REDUCE fragment: `op` is `min` or `max` of the four child texels of the previous level. */
function reduceShader(op) {
	return `@group(0)@binding(0)var src:texture_2d<f32>;struct V{@builtin(position)p:vec4f};@vertex fn vs(@builtin(vertex_index)i:u32)->V{let p=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3))[i];return V(vec4f(p,0,1));}@fragment fn fs(@builtin(position)fc:vec4f)->@location(0)f32{let c=vec2<i32>(fc.xy)*2;let sd=vec2<i32>(textureDimensions(src));let d=sd-vec2<i32>(1,1);let x1=min(c.x+1,d.x);let y1=min(c.y+1,d.y);let a=textureLoad(src,vec2<i32>(c.x,c.y),0).r;let b=textureLoad(src,vec2<i32>(x1,c.y),0).r;let e=textureLoad(src,vec2<i32>(c.x,y1),0).r;let f=textureLoad(src,vec2<i32>(x1,y1),0).r;var r=${op}(${op}(a,b),${op}(e,f));let dd=max(sd/vec2<i32>(2,2),vec2<i32>(1,1));let extraX=(sd.x&1)==1&&i32(fc.x)==dd.x-1;let extraY=(sd.y&1)==1&&i32(fc.y)==dd.y-1;if(extraX){let x2=min(c.x+2,d.x);r=${op}(r,${op}(textureLoad(src,vec2<i32>(x2,c.y),0).r,textureLoad(src,vec2<i32>(x2,y1),0).r));}if(extraY){let y2=min(c.y+2,d.y);r=${op}(r,${op}(textureLoad(src,vec2<i32>(c.x,y2),0).r,textureLoad(src,vec2<i32>(x1,y2),0).r));if(extraX){r=${op}(r,textureLoad(src,vec2<i32>(min(c.x+2,d.x),y2),0).r);}}return r;}`;
}
/** Create a hierarchical depth pyramid sized `width`×`height`. Build it each frame from the live depth texture
*  (via `createDepthPyramidTask`, or `build()` directly). Owns its COPY/REDUCE pipelines + the mipped texture. */
function createDepthPyramid(engine, opts) {
	const device = engine._device;
	const reduce = opts.reduce ?? "max";
	const sampler = getOrCreateSampler(engine, {
		minFilter: "nearest",
		magFilter: "nearest",
		addressModeU: "clamp-to-edge",
		addressModeV: "clamp-to-edge"
	});
	const copyBGL = device.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: SS.FRAGMENT,
		texture: {
			sampleType: "depth",
			viewDimension: "2d"
		}
	}] });
	const reduceBGL = device.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: SS.FRAGMENT,
		texture: {
			sampleType: "unfilterable-float",
			viewDimension: "2d"
		}
	}] });
	const mk = (code, layout) => device.createRenderPipeline({
		layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
		vertex: {
			module: device.createShaderModule({ code }),
			entryPoint: "vs"
		},
		fragment: {
			module: device.createShaderModule({ code }),
			entryPoint: "fs",
			targets: [{ format: "r32float" }]
		},
		primitive: { topology: "triangle-list" }
	});
	const copyPipeline = mk(COPY_SHADER, copyBGL);
	const reducePipeline = mk(reduceShader(reduce), reduceBGL);
	let w = Math.max(1, opts.width | 0);
	let h = Math.max(1, opts.height | 0);
	let mips = mipLevelCount(w, h);
	function makeTexture() {
		return device.createTexture({
			label: "depth-pyramid",
			size: {
				width: w,
				height: h
			},
			format: "r32float",
			usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING,
			mipLevelCount: mips
		});
	}
	function makeWrapper(tex) {
		const wr = {
			texture: tex,
			view: tex.createView(),
			sampler,
			width: w,
			height: h,
			_sampleType: "float"
		};
		acquireTexture(wr);
		return wr;
	}
	let gpuTex = makeTexture();
	let wrapper = makeWrapper(gpuTex);
	let copyDstView;
	let reduceLevels = [];
	let copyBindGroup = null;
	let copyBindGroupSource = null;
	function rebuildViews() {
		copyDstView = gpuTex.createView({
			baseMipLevel: 0,
			mipLevelCount: 1
		});
		reduceLevels = [];
		for (let mip = 1; mip < mips; mip++) {
			const src = gpuTex.createView({
				baseMipLevel: mip - 1,
				mipLevelCount: 1
			});
			const dst = gpuTex.createView({
				baseMipLevel: mip,
				mipLevelCount: 1
			});
			reduceLevels.push({
				dst,
				bindGroup: device.createBindGroup({
					layout: reduceBGL,
					entries: [{
						binding: 0,
						resource: src
					}]
				})
			});
		}
		copyBindGroup = null;
		copyBindGroupSource = null;
	}
	rebuildViews();
	return {
		get texture() {
			return wrapper;
		},
		get mipCount() {
			return mips;
		},
		build(depthTexture, encoder) {
			const enc = encoder ?? device.createCommandEncoder();
			if (copyBindGroup === null || copyBindGroupSource !== depthTexture) {
				copyBindGroup = device.createBindGroup({
					layout: copyBGL,
					entries: [{
						binding: 0,
						resource: depthTexture.view
					}]
				});
				copyBindGroupSource = depthTexture;
			}
			const copyPass = enc.beginRenderPass({
				label: "depth-pyramid-copy",
				colorAttachments: [{
					view: copyDstView,
					loadOp: "clear",
					storeOp: "store",
					clearValue: {
						r: 0,
						g: 0,
						b: 0,
						a: 0
					}
				}]
			});
			copyPass.setPipeline(copyPipeline);
			copyPass.setBindGroup(0, copyBindGroup);
			copyPass.draw(3);
			copyPass.end();
			for (const level of reduceLevels) {
				const pass = enc.beginRenderPass({
					label: "depth-pyramid-reduce",
					colorAttachments: [{
						view: level.dst,
						loadOp: "clear",
						storeOp: "store",
						clearValue: {
							r: 0,
							g: 0,
							b: 0,
							a: 0
						}
					}]
				});
				pass.setPipeline(reducePipeline);
				pass.setBindGroup(0, level.bindGroup);
				pass.draw(3);
				pass.end();
			}
			if (!encoder) device.queue.submit([enc.finish()]);
		},
		resize(nw, nh) {
			const cw = Math.max(1, nw | 0);
			const ch = Math.max(1, nh | 0);
			if (cw === w && ch === h) return;
			w = cw;
			h = ch;
			mips = mipLevelCount(w, h);
			const old = wrapper;
			gpuTex = makeTexture();
			wrapper = makeWrapper(gpuTex);
			rebuildViews();
			releaseTexture(old);
		},
		dispose() {
			releaseTexture(wrapper);
		}
	};
}
/** Create a frame-graph task that rebuilds `pyramid` from `source()` into the FRAME command encoder each frame.
*  Order it right after the pass that produces the depth (e.g. `addTaskAfter(scene, task, depthPrepassTask)`) so
*  the pyramid reflects THIS frame's depth. Resize the pyramid to the source's size before the frame is recorded
*  (the source depth target only changes size on a canvas resize). */
function createDepthPyramidTask(engine, scene, opts) {
	const { pyramid, source } = opts;
	return {
		name: "depth-pyramid",
		engine,
		scene,
		_passes: [],
		record() {},
		execute() {
			const src = source();
			if (!src) return 0;
			pyramid.build(src, engine._currentEncoder);
			return pyramid.mipCount;
		},
		dispose() {
			pyramid.dispose();
		}
	};
}
export { createDepthPyramid, createDepthPyramidTask };

//# sourceMappingURL=depth-pyramid.js.map