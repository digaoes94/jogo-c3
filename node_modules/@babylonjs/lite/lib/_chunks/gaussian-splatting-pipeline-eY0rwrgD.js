import { F32 } from "../engine/typed-arrays.js";
import { getProjectionMatrix, getViewMatrix } from "../camera/camera.js";
import { BU, CW, SS } from "../engine/gpu-flags.js";
import { getRenderTargetSize } from "../engine/engine.js";
import { targetSignatureKey } from "../engine/render-target-signature.js";
import { getSceneBindGroupLayout } from "../render/scene-helpers.js";
import { disposeGaussianSplattingMesh, postSplatSortIfDirty, uploadPendingSplatOrder } from "../mesh/GaussianSplatting/gaussian-splatting-mesh.js";
import { registerPickSource } from "../picking/pick-contributor.js";
// shaders/gaussian-splatting.wgsl?raw
var gaussian_splatting_default = "struct S{w:mat4x4<f32>,v:mat4x4<f32>,p:mat4x4<f32>,vp:vec2<f32>,f:vec2<f32>,ds:vec2<f32>,a:f32,_p:f32}@group(1) @binding(0) var<uniform> u:S;@group(1) @binding(1) var e:sampler;@group(1) @binding(2) var F:texture_2d<f32>;@group(1) @binding(3) var G:texture_2d<f32>;@group(1) @binding(4) var J:texture_2d<f32>;@group(1) @binding(5) var K:texture_2d<f32>;struct A{@builtin(position) pos:vec4<f32>,@location(0) vc:vec4<f32>,@location(1) vq:vec2<f32>}fn B(r:f32)->vec2<f32>{let v=floor(r/u.ds.x);let N=r-v*u.ds.x;return vec2<f32>((N+0.5)/u.ds.x,(v+0.5)/u.ds.y);}@vertex fn vs(@location(0) k:vec2<f32>,@location(1) R:f32)->A{var a:A;let j=B(R);let M=textureSampleLevel(F,e,j,0.0).xyz;let q=textureSampleLevel(K,e,j,0.0);let d=textureSampleLevel(G,e,j,0.0).xyz;let i=textureSampleLevel(J,e,j,0.0).xyz;let C=u.w*vec4<f32>(M,1.0);let m=u.v*u.w;let h=u.v*C;let b=u.p*h;let g=1.2*b.w;if (b.z<0.0||b.x<-g||b.x>g||b.y<-g||b.y>g){a.pos=vec4<f32>(0.0,0.0,2.0,1.0);a.vc=vec4<f32>(0.0);a.vq=vec2<f32>(0.0);return a;}let H=mat3x3<f32>(vec3<f32>(d.x,d.y,d.z),vec3<f32>(d.y,i.x,i.y),vec3<f32>(d.z,i.y,i.z));let f=1.0/h.z;let s=f*f;let E=mat3x3<f32>(vec3<f32>(u.f.x*f,0.0,-u.f.x*h.x*s),vec3<f32>(0.0,u.f.y*f,-u.f.y*h.y*s),vec3<f32>(0.0,0.0,0.0));let P=mat3x3<f32>(m[0].xyz,m[1].xyz,m[2].xyz);let t=transpose(P)*E;var c=transpose(t)*H*t;let w:f32=0.3;c[0][0]+=w;c[1][1]+=w;let z=(c[0][0]+c[1][1])*0.5;let I=(c[0][0]-c[1][1])*0.5;let y=length(vec2<f32>(I,c[0][1]));let x:f32=0.0001;let n=z+y+x;let p=z-y+x;if (p<0.0){a.pos=vec4<f32>(0.0,0.0,2.0,1.0);a.vc=vec4<f32>(0.0);a.vq=vec2<f32>(0.0);return a;}let l=normalize(vec2<f32>(c[0][1],n-c[0][0]));let O=min(sqrt(2.0*n),1024.0)*l;let D=min(sqrt(2.0*p),1024.0)*vec2<f32>(l.y,-l.x);let Q=b.xy;a.pos=vec4<f32>(Q+(k.x*O+k.y*D)*b.w/u.vp,b.z,b.w);a.vc=vec4<f32>(q.rgb,q.a*u.a);a.vq=k;return a;}/*GS_FRAGMENT_DEFINITIONS*/@fragment fn fs(in:A)->@location(0) vec4<f32>{/*GS_FRAGMENT_MAIN_BEGIN*/let o=-dot(in.vq,in.vq);var finalColor:vec4<f32>;if (o>-4.0){let L=exp(o)*in.vc.a;finalColor=vec4<f32>(in.vc.rgb,L);} else{finalColor=vec4<f32>(0.0);}/*GS_FRAGMENT_BEFORE_FRAGCOLOR*//*GS_FRAGMENT_MAIN_END*/return finalColor;}";
// src/mesh/GaussianSplatting/gaussian-splatting-pipeline.ts
/** Gaussian-Splatting render pipeline + Renderable.
*
*  WGSL port of the BJS `gaussianSplatting.vertex.fx` / `.fragment.fx`
*  pair, restricted to the static splat path (no SH, no compound parts).
*  Math is unchanged: the EWA / Vrk projection of the 3D anisotropic
*  Gaussian is computed exactly as in BJS, then the per-fragment
*  density `exp(-r²) * α` is multiplied with the splat colour.
*
*  Per-frame the binding's `update` hook:
*    1. uploads the latest sorted splatIndex order received from the worker
*       (`uploadPendingSplatOrder` — at most one upload per frame, stale
*       results are dropped),
*    2. refreshes the per-mesh UBO (world / view / projection / focal / viewport),
*    3. posts a fresh sort job when the camera/world state drifted past the
*       re-sort epsilon and an order buffer is free (`postSplatSortIfDirty` —
*       shared with the SH pipeline, see gaussian-splatting-mesh.ts).
*
*  The pipeline is cached per `RenderTargetSignature`. */
var _cache = null;
function applyGsFragments(wgsl, fragments) {
	const slotCode = {};
	for (const frag of fragments) {
		if (frag.helperFunctions) slotCode["GS_FRAGMENT_DEFINITIONS"] = (slotCode["GS_FRAGMENT_DEFINITIONS"] ?? "") + frag.helperFunctions + "\n";
		for (const [slot, code] of Object.entries(frag.fragmentSlots ?? {})) slotCode[slot] = (slotCode[slot] ?? "") + code + "\n";
	}
	const spliced = wgsl.replace(/\/\*(GS_FRAGMENT_\w+)\*\//g, (_, slot) => slotCode[slot] ?? "");
	const mangles = [
		["world", "w"],
		["view", "v"],
		["projection", "p"],
		["viewport", "vp"],
		["focal", "f"],
		["dataSize", "ds"],
		["alpha", "a"],
		["_pad", "_p"],
		["vColor", "vc"],
		["vPos", "vq"],
		["dataUv", "du"],
		["splatIndex", "si"],
		["corner", "co"],
		["center", "ce"],
		["color", "cl"],
		["covA", "ca"],
		["covB", "cb"],
		["worldPos", "wp"],
		["modelView", "mv"],
		["camspace", "cs"],
		["pos2d", "p2"],
		["bounds", "bd"],
		["Vrk", "vr"],
		["invZ2", "iz2"],
		["invZ", "iz"],
		["cov2d", "c2"],
		["kernelSize", "ks"],
		["radius", "ra"],
		["epsilon", "ep"],
		["lambda1", "l1"],
		["lambda2", "l2"],
		["diag", "dg"],
		["majorAxis", "ma"],
		["minorAxis", "mi"],
		["vCenter", "vc2"]
	];
	let mangled = spliced;
	for (const [from, to] of mangles) mangled = mangled.replace(new RegExp(`\\b${from}\\b`, "g"), to);
	return mangled;
}
function getOrCreatePipeline(engine, sig, fragments) {
	const device = engine._device;
	if (!_cache || _cache.device !== device) _cache = {
		device,
		modules: /* @__PURE__ */ new Map(),
		entries: /* @__PURE__ */ new Map()
	};
	const fragKey = fragments && fragments.length > 0 ? "|" + fragments.map((f) => f.id).join(",") : "";
	const key = targetSignatureKey(sig) + fragKey;
	let entry = _cache.entries.get(key);
	if (entry) return entry;
	let module = _cache.modules.get(fragKey);
	if (!module) {
		module = device.createShaderModule({ code: fragments && fragments.length > 0 ? applyGsFragments(gaussian_splatting_default, fragments) : gaussian_splatting_default });
		_cache.modules.set(fragKey, module);
	}
	const meshBindGroupLayout = device.createBindGroupLayout({ entries: [
		{
			binding: 0,
			visibility: SS.VERTEX | SS.FRAGMENT,
			buffer: { type: "uniform" }
		},
		{
			binding: 1,
			visibility: SS.VERTEX,
			sampler: { type: "non-filtering" }
		},
		{
			binding: 2,
			visibility: SS.VERTEX,
			texture: { sampleType: "unfilterable-float" }
		},
		{
			binding: 3,
			visibility: SS.VERTEX,
			texture: { sampleType: "unfilterable-float" }
		},
		{
			binding: 4,
			visibility: SS.VERTEX,
			texture: { sampleType: "unfilterable-float" }
		},
		{
			binding: 5,
			visibility: SS.VERTEX,
			texture: { sampleType: "unfilterable-float" }
		}
	] });
	entry = {
		pipeline: device.createRenderPipeline({
			layout: device.createPipelineLayout({ bindGroupLayouts: [getSceneBindGroupLayout(engine), meshBindGroupLayout] }),
			vertex: {
				module,
				entryPoint: "vs",
				buffers: [{
					arrayStride: 8,
					stepMode: "vertex",
					attributes: [{
						shaderLocation: 0,
						offset: 0,
						format: "float32x2"
					}]
				}, {
					arrayStride: 4,
					stepMode: "instance",
					attributes: [{
						shaderLocation: 1,
						offset: 0,
						format: "float32"
					}]
				}]
			},
			fragment: {
				module,
				entryPoint: "fs",
				targets: [{
					format: sig._colorFormat,
					blend: {
						color: {
							srcFactor: "src-alpha",
							dstFactor: "one-minus-src-alpha",
							operation: "add"
						},
						alpha: {
							srcFactor: "one",
							dstFactor: "one-minus-src-alpha",
							operation: "add"
						}
					},
					writeMask: CW.ALL
				}]
			},
			primitive: {
				topology: "triangle-list",
				cullMode: "none"
			},
			depthStencil: {
				format: sig._depthStencilFormat ?? "depth24plus-stencil8",
				depthCompare: sig._depthCompare ?? "greater-equal",
				depthWriteEnabled: false
			},
			multisample: { count: sig._sampleCount }
		}),
		meshBindGroupLayout
	};
	_cache.entries.set(key, entry);
	return entry;
}
/** Build the Renderable for a GaussianSplattingMesh. Called from the deferred
*  builder installed by `addToScene`. Owns the per-mesh UBO and a per-signature
*  bind-group cache. */
function buildGaussianSplattingRenderable(scene, mesh, fragments) {
	const engine = scene.surface.engine;
	const device = engine._device;
	const UBO_BYTES = 224;
	const ubo = device.createBuffer({
		size: UBO_BYTES,
		usage: BU.UNIFORM | BU.COPY_DST
	});
	const cpu = new F32(UBO_BYTES / 4);
	cpu[52] = mesh.textureWidth;
	cpu[53] = mesh.textureHeight;
	cpu[54] = 1;
	cpu[55] = 0;
	const bindGroups = /* @__PURE__ */ new Map();
	const getBindGroup = (entry) => {
		let bg = bindGroups.get(entry.pipeline);
		if (bg) return bg;
		bg = device.createBindGroup({
			layout: entry.meshBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: ubo }
				},
				{
					binding: 1,
					resource: mesh._gs._sampler
				},
				{
					binding: 2,
					resource: mesh._gs._centersView
				},
				{
					binding: 3,
					resource: mesh._gs._covAView
				},
				{
					binding: 4,
					resource: mesh._gs._covBView
				},
				{
					binding: 5,
					resource: mesh._gs._colorsView
				}
			]
		});
		bindGroups.set(entry.pipeline, bg);
		return bg;
	};
	const update = () => {
		const cam = scene.camera;
		if (!cam) return;
		uploadPendingSplatOrder(device.queue, mesh);
		const size = getRenderTargetSize(engine);
		const aspect = size.width / size.height;
		const view = getViewMatrix(cam);
		const proj = getProjectionMatrix(cam, aspect);
		const world = mesh.worldMatrix;
		cpu.set(world, 0);
		cpu.set(view, 16);
		cpu.set(proj, 32);
		cpu[48] = size.width;
		cpu[49] = size.height;
		cpu[50] = size.width * .5 * proj[0];
		cpu[51] = size.height * .5 * proj[5];
		device.queue.writeBuffer(ubo, 0, cpu.buffer, 0, UBO_BYTES);
		postSplatSortIfDirty(mesh, world, view);
	};
	const r = {
		order: 200,
		isTransparent: true,
		bind(eng, sig) {
			const entry = getOrCreatePipeline(eng, sig, fragments);
			const bindGroup = getBindGroup(entry);
			return {
				renderable: r,
				pipeline: entry.pipeline,
				update,
				draw(pass) {
					pass.setBindGroup(1, bindGroup);
					pass.setVertexBuffer(0, mesh._gs._quadBuffer);
					pass.setVertexBuffer(1, mesh._gs._splatIndexBuffer);
					pass.setIndexBuffer(mesh._gs._indexBuffer, "uint16");
					pass.drawIndexed(6, mesh.vertexCount);
					return 1;
				}
			};
		}
	};
	return r;
}
/** Wire a `GaussianSplattingMesh` into a scene: pushes its renderable +
*  registers a disposer that frees per-mesh GPU buffers and the worker.
*  Called from the deferred builder installed by `addToScene`. */
function attachGaussianSplattingMesh(scene, mesh, fragments) {
	const ctx = scene;
	ctx._renderables.push(buildGaussianSplattingRenderable(scene, mesh, fragments));
	const unregisterPick = registerPickSource(scene, mesh, () => import("../picking/gs-picking-pipeline.js"));
	ctx._disposables.push(() => {
		unregisterPick();
		disposeGaussianSplattingMesh(mesh);
	});
}
export { attachGaussianSplattingMesh as n, buildGaussianSplattingRenderable as r, applyGsFragments as t };

//# sourceMappingURL=gaussian-splatting-pipeline-eY0rwrgD.js.map