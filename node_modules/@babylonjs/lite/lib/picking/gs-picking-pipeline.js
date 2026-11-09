import { F32 } from "../engine/typed-arrays.js";
import { getProjectionMatrix, getViewMatrix } from "../camera/camera.js";
import { BU, SS } from "../engine/gpu-flags.js";
import { getRenderTargetSize } from "../engine/engine.js";
import { getPickingSceneBGL } from "./picking-scene-bgl.js";
import { t as applyGsFragments } from "../_chunks/gaussian-splatting-pipeline-eY0rwrgD.js";
import { encodeIdToColor, gsGpuPickingFragment } from "../mesh/GaussianSplatting/gs-gpu-picking-fragment.js";
// src/picking/gs-picking-pipeline.ts
/** GS GPU-picking pipeline — dynamic-imported by `gpu-picker.ts` when a scene
*  contains a Gaussian-Splatting mesh.
*
*  The pipeline is a variant of the base Gaussian-splatting render pipeline
*  (`gaussian-splatting.wgsl`) with three modifications, applied via string
*  substitution + the `applyGsFragments` plugin system so the base shader stays
*  untouched:
*
*  1.  A scene UBO at `@group(0) @binding(0)` carries a `pickMatrix`
*      (column-major 4x4) that zooms NDC onto the pick pixel — same maths as
*      `computePickVP` in `gpu-picker.ts`, but applied *after* the GS-specific
*      projection so the EWA Jacobian / `u.focal` math is untouched.
*  2.  The fragment returns `FsOut { @location(0) color, @location(1) depth }`
*      so the picker can read a pick id + NDC z from the 1×1 render target.
*  3.  `gsGpuPickingFragment` is applied (via `applyGsFragments`) to inject the
*      per-mesh `pickingColor` UBO at `@group(2) @binding(0)` and override the
*      fragment color with the encoded pick id.  This mirrors BJS
*      `GaussianSplattingGpuPickingMaterialPlugin`'s `getCustomCode`/`bindForSubMesh`
*      split.
*
*  The pipeline has no blending and `depthWriteEnabled = true`, so the
*  closest-splat wins at each pick pixel (matching BJS GPU picker behaviour). */
var _cache = null;
/** Scratch pick matrix, reused across GS pick draws (recomputed per draw from the pick pixel). */
var _gsPickMx = new F32(16);
/** Build the GS picking WGSL as a self-contained template literal.
*
*  This is a variant of the base GS shader (`gaussian-splatting.wgsl`) with two
*  modifications baked in directly (rather than string-patched at runtime), so
*  it survives identifier-mangling minification in production bundles:
*
*  1. The final `out.pos` is pre-multiplied by `gsPickScene.pickMatrix` (a 4×4
*     UBO at `@group(0) @binding(0)`) — applied *after* the GS-specific
*     projection so the EWA Jacobian / `u.focal` math is untouched.
*  2. The fragment returns `FsOut { @location(0) color, @location(1) depth }`
*     so the picker can read pick id + NDC z from the 1×1 render target.
*
*  The fragment keeps the `/* GS_FRAGMENT_* *\/` slot markers so
*  `gsGpuPickingFragment` is still spliced in via `applyGsFragments` to
*  override `finalColor` with the encoded pick id.  Template-literal WGSL
*  goes through `minifyTemplateWgsl` (preserves block comments) in the
*  bundle pipeline, so the slot markers survive minification.
*/
function buildPickingWgsl(detailed) {
	return applyGsFragments(`struct GsPickScene{pickMatrix:mat4x4<f32>};@group(0)@binding(0)var<uniform>gsPickScene:GsPickScene;struct U{world:mat4x4<f32>,view:mat4x4<f32>,projection:mat4x4<f32>,viewport:vec2<f32>,focal:vec2<f32>,dataSize:vec2<f32>,alpha:f32,_pad:f32,};@group(1)@binding(0)var<uniform>u:U;@group(1)@binding(1)var samp:sampler;@group(1)@binding(2)var centersTex:texture_2d<f32>;@group(1)@binding(3)var covATex:texture_2d<f32>;@group(1)@binding(4)var covBTex:texture_2d<f32>;@group(1)@binding(5)var colorsTex:texture_2d<f32>;struct VOut{@builtin(position)pos:vec4<f32>,@location(0)vColor:vec4<f32>,@location(1)vPos:vec2<f32>,};fn dataUv(idx:f32)->vec2<f32>{let y=floor(idx/u.dataSize.x);let x=idx-y*u.dataSize.x;return vec2<f32>((x+0.5)/u.dataSize.x,(y+0.5)/u.dataSize.y);}@vertex fn vs(@location(0)corner:vec2<f32>,@location(1)splatIndex:f32)->VOut{var out:VOut;let uv=dataUv(splatIndex);let center=textureSampleLevel(centersTex,samp,uv,0.0).xyz;let color=textureSampleLevel(colorsTex,samp,uv,0.0);let covA=textureSampleLevel(covATex,samp,uv,0.0).xyz;let covB=textureSampleLevel(covBTex,samp,uv,0.0).xyz;let worldPos=u.world*vec4<f32>(center,1.0);let modelView=u.view*u.world;let camspace=u.view*worldPos;let pos2d=u.projection*camspace;let bounds=1.2*pos2d.w;if(pos2d.z<0.0||pos2d.x<-bounds||pos2d.x>bounds||pos2d.y<-bounds||pos2d.y>bounds){out.pos=vec4<f32>(0.0,0.0,2.0,1.0);out.vColor=vec4<f32>(0.0);out.vPos=vec2<f32>(0.0);return out;}let Vrk=mat3x3<f32>(vec3<f32>(covA.x,covA.y,covA.z),vec3<f32>(covA.y,covB.x,covB.y),vec3<f32>(covA.z,covB.y,covB.z));let invZ=1.0/camspace.z;let invZ2=invZ*invZ;let J=mat3x3<f32>(vec3<f32>(u.focal.x*invZ,0.0,-u.focal.x*camspace.x*invZ2),vec3<f32>(0.0,u.focal.y*invZ,-u.focal.y*camspace.y*invZ2),vec3<f32>(0.0,0.0,0.0));let mv3=mat3x3<f32>(modelView[0].xyz,modelView[1].xyz,modelView[2].xyz);let T=transpose(mv3)*J;var cov2d=transpose(T)*Vrk*T;let kernelSize:f32=0.3;cov2d[0][0]+=kernelSize;cov2d[1][1]+=kernelSize;let mid=(cov2d[0][0]+cov2d[1][1])*0.5;let dxy=(cov2d[0][0]-cov2d[1][1])*0.5;let radius=length(vec2<f32>(dxy,cov2d[0][1]));let epsilon:f32=0.0001;let lambda1=mid+radius+epsilon;let lambda2=mid-radius+epsilon;if(lambda2<0.0){out.pos=vec4<f32>(0.0,0.0,2.0,1.0);out.vColor=vec4<f32>(0.0);out.vPos=vec2<f32>(0.0);return out;}let diag=normalize(vec2<f32>(cov2d[0][1],lambda1-cov2d[0][0]));let majorAxis=min(sqrt(2.0*lambda1),1024.0)*diag;let minorAxis=min(sqrt(2.0*lambda2),1024.0)*vec2<f32>(diag.y,-diag.x);let vCenter=pos2d.xy;out.pos=gsPickScene.pickMatrix*vec4<f32>(vCenter+(corner.x*majorAxis+corner.y*minorAxis)*pos2d.w/u.viewport,pos2d.z,pos2d.w);out.vColor=vec4<f32>(color.rgb,color.a*u.alpha);out.vPos=corner;return out;} /*GS_FRAGMENT_DEFINITIONS*/struct FsOut{@location(0)color:vec4<f32>,@location(1)depth:f32${detailed ? ", @location(2) detail: vec4u" : ""}};@fragment fn fs(in:VOut)->FsOut{ /*GS_FRAGMENT_MAIN_BEGIN*/let A=-dot(in.vPos,in.vPos);var finalColor:vec4<f32>;if(A>-4.0){let B=exp(A)*in.vColor.a;finalColor=vec4<f32>(in.vColor.rgb,B);}else{finalColor=vec4<f32>(0.0);} /*GS_FRAGMENT_BEFORE_FRAGCOLOR*/ /*GS_FRAGMENT_MAIN_END*/return FsOut(finalColor,in.pos.z${detailed ? ", vec4u(0xffffffffu, 0u, 0u, 0u)" : ""});}`, [gsGpuPickingFragment]);
}
function getCache(engine) {
	const device = engine._device;
	if (_cache && _cache.device === device) return _cache;
	const meshBGL = device.createBindGroupLayout({
		label: "gs-picking-mesh-bgl",
		entries: [
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
		]
	});
	const pickingBGL = device.createBindGroupLayout({
		label: "gs-picking-pick-bgl",
		entries: [{
			binding: 0,
			visibility: SS.FRAGMENT,
			buffer: { type: "uniform" }
		}]
	});
	const pickMatrixUbo = device.createBuffer({
		size: 64,
		usage: BU.UNIFORM | BU.COPY_DST,
		label: "gs-picking-scene-ubo"
	});
	const sceneBG = device.createBindGroup({
		label: "gs-picking-scene-bg",
		layout: getPickingSceneBGL(engine),
		entries: [{
			binding: 0,
			resource: { buffer: pickMatrixUbo }
		}]
	});
	_cache = {
		device,
		pipelines: /* @__PURE__ */ new Map(),
		meshBGL,
		pickingBGL,
		pickMatrixUbo,
		sceneBG
	};
	return _cache;
}
function getPickingPipeline(engine, detailed) {
	const cache = getCache(engine);
	const key = detailed ? "detailed" : "basic";
	const cached = cache.pipelines.get(key);
	if (cached) return cached;
	const device = engine._device;
	const module = device.createShaderModule({
		label: `gs-picking-${key}-shader`,
		code: buildPickingWgsl(detailed)
	});
	const pipeline = device.createRenderPipeline({
		label: `gs-picking-${key}-pipeline`,
		layout: device.createPipelineLayout({ bindGroupLayouts: [
			getPickingSceneBGL(engine),
			cache.meshBGL,
			cache.pickingBGL
		] }),
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
			targets: detailed ? [
				{ format: "rgba8unorm" },
				{ format: "r32float" },
				{ format: "rgba32uint" }
			] : [{ format: "rgba8unorm" }, { format: "r32float" }]
		},
		primitive: {
			topology: "triangle-list",
			cullMode: "none"
		},
		depthStencil: {
			format: "depth24plus",
			depthCompare: "less",
			depthWriteEnabled: true
		},
		multisample: { count: 1 }
	});
	cache.pipelines.set(key, pipeline);
	return pipeline;
}
/** Write a 4x4 pickMatrix into the shared scene UBO and bind group 0 on `pass`. */
function gsPickWritePickMatrixAndBind(pass, engine, pickMatrix) {
	const cache = getCache(engine);
	engine._device.queue.writeBuffer(cache.pickMatrixUbo, 0, pickMatrix.buffer, pickMatrix.byteOffset, pickMatrix.byteLength);
	pass.setBindGroup(0, cache.sceneBG);
}
function createGsPickMeshResources(engine, mesh) {
	const device = engine._device;
	const cache = getCache(engine);
	const UBO_BYTES = 224;
	const meshUbo = device.createBuffer({
		size: UBO_BYTES,
		usage: BU.UNIFORM | BU.COPY_DST,
		label: "gs-picking-mesh-ubo"
	});
	const meshCpu = new F32(UBO_BYTES / 4);
	meshCpu[52] = mesh.textureWidth;
	meshCpu[53] = mesh.textureHeight;
	meshCpu[54] = 1;
	const meshBG = device.createBindGroup({
		label: "gs-picking-mesh-bg",
		layout: cache.meshBGL,
		entries: [
			{
				binding: 0,
				resource: { buffer: meshUbo }
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
	const pickingUbo = device.createBuffer({
		size: 16,
		usage: BU.UNIFORM | BU.COPY_DST,
		label: "gs-picking-color-ubo"
	});
	const pickingCpu = new F32(4);
	return {
		meshUbo,
		meshBG,
		pickingUbo,
		pickingBG: device.createBindGroup({
			label: "gs-picking-color-bg",
			layout: cache.pickingBGL,
			entries: [{
				binding: 0,
				resource: { buffer: pickingUbo }
			}]
		}),
		meshCpu,
		pickingCpu
	};
}
function disposeGsPickMeshResources(res) {
	res.meshUbo.destroy();
	res.pickingUbo.destroy();
}
/** Issue a pick draw for a single GS mesh.  The caller must have already bound
*  the scene bind group (`pickMatrix` at group 0) on the pass; `pickId` is the
*  24-bit pick id assigned by the picker. */
function drawGsForPicking(pass, engine, scene, mesh, res, pickId, targetWidth, targetHeight, detailed = false) {
	const cam = scene.camera;
	if (!cam) return;
	const size = getRenderTargetSize(engine);
	const aspect = (targetWidth || size.width) / (targetHeight || size.height);
	const view = getViewMatrix(cam);
	const proj = getProjectionMatrix(cam, aspect);
	const world = mesh.worldMatrix;
	const cpu = res.meshCpu;
	cpu.set(world, 0);
	cpu.set(view, 16);
	cpu.set(proj, 32);
	cpu[48] = size.width;
	cpu[49] = size.height;
	cpu[50] = size.width * .5 * proj[0];
	cpu[51] = size.height * .5 * proj[5];
	engine._device.queue.writeBuffer(res.meshUbo, 0, cpu.buffer, 0, cpu.byteLength);
	const [r, g, b] = encodeIdToColor(pickId);
	res.pickingCpu[0] = r;
	res.pickingCpu[1] = g;
	res.pickingCpu[2] = b;
	res.pickingCpu[3] = 0;
	engine._device.queue.writeBuffer(res.pickingUbo, 0, res.pickingCpu.buffer, 0, 16);
	pass.setPipeline(getPickingPipeline(engine, detailed));
	pass.setBindGroup(1, res.meshBG);
	pass.setBindGroup(2, res.pickingBG);
	pass.setVertexBuffer(0, mesh._gs._quadBuffer);
	pass.setVertexBuffer(1, mesh._gs._splatIndexBuffer);
	pass.setIndexBuffer(mesh._gs._indexBuffer, "uint16");
	pass.drawIndexed(6, mesh.vertexCount);
}
/** Draw one GS mesh into the shared pick pass as a pick contributor: (re)binds the GS pick
*  matrix at group 0, then issues the pick draw with id `baseId`. The GS pipeline zooms its own
*  clip-space output onto the pick pixel, so it rebinds group 0 — the next contributor must
*  rebind what it needs (billboards rebind the mesh pick VP). */
function drawGsMeshForPicking(ctx, mesh, res, baseId) {
	computeGsPickMatrix(_gsPickMx, ctx.px, ctx.py, ctx.w, ctx.h);
	gsPickWritePickMatrixAndBind(ctx.pass, ctx.engine, _gsPickMx);
	drawGsForPicking(ctx.pass, ctx.engine, ctx.scene, mesh, res, baseId, ctx.w, ctx.h, ctx.detailed);
}
/** Compute the pickMatrix for GS picking — same matrix `computePickVP` builds,
*  but applied to the clip-space output of the GS shader rather than the world.
*
*  Maps the exact canvas sample coordinate ↦ (0, 0), and scales by (w, h) so a single canvas
*  pixel covers the full 1×1 pick render target. */
function computeGsPickMatrix(out, sampleX, sampleY, w, h) {
	const ndcX = 2 * sampleX / w - 1;
	const ndcY = 1 - 2 * sampleY / h;
	out[0] = w;
	out[1] = 0;
	out[2] = 0;
	out[3] = 0;
	out[4] = 0;
	out[5] = h;
	out[6] = 0;
	out[7] = 0;
	out[8] = 0;
	out[9] = 0;
	out[10] = 1;
	out[11] = 0;
	out[12] = -ndcX * w;
	out[13] = -ndcY * h;
	out[14] = 0;
	out[15] = 1;
}
/** Build the pick contributor for one GS mesh (one pick id). The picker calls this once (via the pick
*  source registered by the GS pipeline) and reuses the result, so the pick GPU resources live in
*  this closure and free in `dispose`. */
function createPickContributor(mesh) {
	let res = null;
	return {
		draw(ctx, baseId) {
			if (mesh.visible === false) return baseId + 1;
			res ??= createGsPickMeshResources(ctx.engine, mesh);
			drawGsMeshForPicking(ctx, mesh, res, baseId);
			return baseId + 1;
		},
		resolve(info) {
			info.pickedMesh = mesh;
		},
		dispose() {
			if (res) {
				disposeGsPickMeshResources(res);
				res = null;
			}
		}
	};
}
export { computeGsPickMatrix, createGsPickMeshResources, createPickContributor, disposeGsPickMeshResources, drawGsForPicking, drawGsMeshForPicking, gsPickWritePickMatrixAndBind };

//# sourceMappingURL=gs-picking-pipeline.js.map