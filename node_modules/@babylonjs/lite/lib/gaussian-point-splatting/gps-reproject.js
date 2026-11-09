import { invertMat4 } from "../math/invert-mat4.js";
import { multiplyMat4 } from "../math/multiply-mat4.js";
import { BU } from "../engine/gpu-flags.js";
import { packMat4IntoF32 } from "../math/pack-mat4-into-f32.js";
// src/gaussian-point-splatting/gps-reproject.ts
/**
* Experimental temporal reprojection for Gaussian point splatting, loaded on demand when
* `temporalReprojection` is enabled so scenes without it do not pay for the shaders.
* @internal
*/
var REPROJECT = `struct Reproject{m:mat4x4f,inv:mat4x4f,projectionInverse:mat4x4f,info:vec4f}@group(0)@binding(0)var<uniform>r:Reproject;fn viewDepth(clip:vec4f)->f32{let view=r.projectionInverse*clip;return view.z/view.w;}fn valid(clip:vec4f)->bool{let z=clip.z/clip.w;let v=viewDepth(clip);return clip.w>0.0&&clip.w<=3.402823e38&&z>0.0&&z<=1.0&&v>0.0&&v<=3.402823e38;}fn reprojected(p:u32,z:f32)->vec4f{let size=u32(r.info.x);let ndc=(vec2f(f32(p%size),f32(p/size))+0.5)/r.info.xy*2.0-1.0;return r.m*vec4f(ndc.x,-ndc.y,z,1.0);}fn destination(clip:vec4f)->u32{let px=(vec2f(clip.x,-clip.y)/clip.w*0.5+0.5)*r.info.xy;if(valid(clip)&&all(px>=vec2f(0.0))&&all(px<r.info.xy)){return u32(px.y)*u32(r.info.x)+u32(px.x);}return 0xffffffffu;}`;
/** Forward scatter estimates current depth: nearest depth first, then the winning source pixel. */
function scatterShader(source) {
	return ` ${REPROJECT} @group(0)@binding(1)var<storage,read>prevDepth:array<f32>;@group(0)@binding(2)var<storage,read>prevCounts:array<u32>;${source ? `@group(0)@binding(3)var<storage,read>nearest:array<u32>;@group(0)@binding(4)var<storage,read_write>winner:array<atomic<u32>>;` : `@group(0)@binding(3)var<storage,read_write>nearest:array<atomic<u32>>;`} @compute@workgroup_size(8,8)fn main(@builtin(global_invocation_id)id:vec3u){if(any(id.xy>=vec2u(r.info.xy))){return;}let p=id.y*u32(r.info.x)+id.x;let z=prevDepth[p];let count=prevCounts[p];if((count>>16u)!=u32(r.info.z)||(count&65535u)==0u||!(z>0.0&&z<=1.0)){return;}let clip=reprojected(p,z);let d=destination(clip);if(d==0xffffffffu){return;}let key=bitcast<u32>(clip.z/clip.w);${source ? `if(nearest[d]==key){atomicMax(&winner[d],p+1u);}` : `atomicMax(&nearest[d],key);`}}`;
}
/** Pulls bilinear history at exact destination centers, using scattered depth and neighbor estimates for cracks/holes. */
var GATHER = ` ${REPROJECT} @group(0)@binding(1)var<storage,read>nearest:array<u32>;@group(0)@binding(2)var<storage,read>winner:array<u32>;@group(0)@binding(3)var<storage,read>prevAccum:array<vec4f>;@group(0)@binding(4)var<storage,read>prevDepth:array<f32>;@group(0)@binding(5)var<storage,read>prevCounts:array<u32>;@group(0)@binding(6)var<storage,read_write>accum:array<vec4f>;@group(0)@binding(7)var<storage,read_write>depth:array<f32>;@group(0)@binding(8)var<storage,read_write>counts:array<u32>;@compute@workgroup_size(8,8)fn main(@builtin(global_invocation_id)id:vec3u){let size=vec2u(r.info.xy);if(any(id.xy>=size)){return;}let d=id.y*size.x+id.x;var own=0.0;if(winner[d]!=0u){let p=winner[d]-1u;own=viewDepth(reprojected(p,prevDepth[p]));}var closest=3.402823e38;var nearSource=0u;var farthest=0.0;var farSource=0u;var nearer=0u;for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){let q=vec2i(id.xy)+vec2i(x,y);if((x!=0||y!=0)&&all(q>=vec2i(0))&&all(q<vec2i(size))){let n=u32(q.y)*size.x+u32(q.x);if(nearest[n]!=0u){let p=winner[n]-1u;let v=viewDepth(reprojected(p,prevDepth[p]));if(v<closest){closest=v;nearSource=winner[n];}if(v>farthest){farthest=v;farSource=winner[n];}if(own>0.0&&v<0.9*own){nearer++;}}}}}var p=winner[d];var filled=false;if(nearer>=6u){p=nearSource;filled=true;}if(p==0u){p=farSource;filled=true;}let generation=u32(r.info.z)<<16u;if(p==0u){accum[d]=vec4f(0.0);depth[d]=0.0;counts[d]=generation;return;}p-=1u;let clip=reprojected(p,prevDepth[p]);let zc=clip.z/clip.w;let vc=viewDepth(clip);let ndc=(vec2f(id.xy)+0.5)/r.info.xy*2.0-1.0;let previous=r.inv*vec4f(ndc.x,-ndc.y,zc,1.0);var color=vec4f(0.0);var weight=0.0;var samples=65535u;if(previous.w>0.0&&previous.w<=3.402823e38){let pp=(vec2f(previous.x,-previous.y)/previous.w*0.5+0.5)*r.info.xy-0.5;let base=vec2i(floor(pp));let f=fract(pp);for(var y=0;y<2;y++){for(var x=0;x<2;x++){let q=base+vec2i(x,y);let w=select(1.0-f.x,f.x,x==1)*select(1.0-f.y,f.y,y==1);if(w>0.0&&all(q>=vec2i(0))&&all(q<vec2i(size))){let t=u32(q.y)*size.x+u32(q.x);let count=prevCounts[t];let z=prevDepth[t];if((count>>16u)==u32(r.info.z)&&(count&65535u)>0u&&z>0.0&&z<=1.0){let tap=reprojected(t,z);if(valid(tap)&&abs(viewDepth(tap)-vc)<=0.05*vc){color+=w*prevAccum[t];weight+=w;samples=min(samples,count&65535u);}}}}}}var count=min(prevCounts[p]&65535u,u32(r.info.w));if(weight>=1e-4){color/=weight;count=min(samples,u32(r.info.w));}else{color=prevAccum[p];}if(filled){count=max(1u,count/2u);}accum[d]=color;depth[d]=clamp(zc,0.0,1.0);counts[d]=generation|count;}`;
var pipelineCache = null;
/**
* Packs the previous-NDC → current-clip matrix, its inverse and current inverse projection into 48 floats.
* Returns null for singular or non-finite transforms.
* `matrices` packs the previous world, view and projection at offsets 0, 16 and 32.
*/
function gpsReprojectionMatrix(matrices, world, view, projection) {
	const previous = invertMat4(multiplyMat4(multiplyMat4(matrices.subarray(32, 48), matrices.subarray(16, 32)), matrices.subarray(0, 16)));
	if (!previous) return null;
	const matrix = multiplyMat4(multiplyMat4(multiplyMat4(projection, view), world), previous);
	const inverse = invertMat4(matrix);
	const projectionInverse = invertMat4(projection);
	if (!inverse || !projectionInverse) return null;
	const result = /* @__PURE__ */ new Float32Array(48);
	packMat4IntoF32(result, matrix);
	packMat4IntoF32(result, inverse, 16);
	packMat4IntoF32(result, projectionInverse, 32);
	return result.every(Number.isFinite) ? result : null;
}
/** Remaps accumulation in place. `params` packs three matrices, then (width, height, generation, history cap) at float offset 48. */
function gpsRecordReprojection(device, encoder, target, params, createBuffer, dispatch) {
	const width = params[48];
	const height = params[49];
	const size = width * height;
	let history = target.history;
	if (!history) {
		const buffers = [];
		const make = (bytes, label, usage) => {
			const value = createBuffer(bytes, label, usage);
			buffers.push(value);
			return value;
		};
		try {
			history = {
				params: make(208, "reprojection parameters", BU.UNIFORM | BU.COPY_DST),
				accum: make(size * 16, "previous accumulation"),
				depth: make(size * 4, "previous depth"),
				counts: make(size * 4, "previous counts"),
				nearest: make(size * 4, "reprojection depth"),
				winner: make(size * 4, "reprojection source")
			};
		} catch (error) {
			buffers.forEach((value) => value.destroy());
			throw error;
		}
		target.buffers.push(...buffers);
		target.history = history;
	}
	let pipelines = pipelineCache?.get(device);
	if (!pipelines) {
		const compute = (code, label) => device.createComputePipeline({
			label: `GPS ${label}`,
			layout: "auto",
			compute: {
				module: device.createShaderModule({
					label: `GPS ${label}`,
					code
				}),
				entryPoint: "main"
			}
		});
		pipelines = {
			nearest: compute(scatterShader(false), "reproject nearest"),
			winner: compute(scatterShader(true), "reproject source"),
			gather: compute(GATHER, "reproject gather")
		};
		(pipelineCache ??= /* @__PURE__ */ new WeakMap()).set(device, pipelines);
	}
	const x = Math.ceil(width / 8);
	const y = Math.ceil(height / 8);
	device.queue.writeBuffer(history.params, 0, params);
	encoder.copyBufferToBuffer(target.accum, 0, history.accum, 0, size * 16);
	encoder.copyBufferToBuffer(target.depth, 0, history.depth, 0, size * 4);
	encoder.copyBufferToBuffer(target.counts, 0, history.counts, 0, size * 4);
	encoder.clearBuffer(history.nearest);
	encoder.clearBuffer(history.winner);
	dispatch(pipelines.nearest, [
		history.params,
		history.depth,
		history.counts,
		history.nearest
	], x, y);
	dispatch(pipelines.winner, [
		history.params,
		history.depth,
		history.counts,
		history.nearest,
		history.winner
	], x, y);
	dispatch(pipelines.gather, [
		history.params,
		history.nearest,
		history.winner,
		history.accum,
		history.depth,
		history.counts,
		target.accum,
		target.depth,
		target.counts
	], x, y);
}
export { gpsRecordReprojection, gpsReprojectionMatrix };

//# sourceMappingURL=gps-reproject.js.map