import { _resolveRenderTargetSize, buildRenderTarget, createRenderTarget, disposeRenderTarget } from "../engine/render-target.js";
import { createPostProcessTask } from "../frame-graph/post-process-task.js";
// src/post-process/smaa.ts
var EDGE_UNIFORM_WGSL = `struct SmaaEdgeParams{threshold:f32,srgb:f32,pad1:f32,pad2:f32}@group(0)@binding(2)var<uniform>smaaEdge:SmaaEdgeParams;`;
var EDGE_FRAGMENT_WGSL = `fn smaaLuma(c:vec3f)->f32{return dot(c,vec3f(0.2126,0.7152,0.0722));}fn smaaEnc(c:f32)->f32{return select(1.055*pow(c,1.0/2.4)-0.055,c*12.92,c<=0.0031308);}fn smaaDetectLuma(c:vec3f)->f32{if(smaaEdge.srgb>0.5){return smaaLuma(vec3f(smaaEnc(clamp(c.r,0.0,1.0)),smaaEnc(clamp(c.g,0.0,1.0)),smaaEnc(clamp(c.b,0.0,1.0))));}return smaaLuma(c);}fn smaaFetch(uv:vec2f)->vec4f{return textureSampleLevel(sourceTextureSampler,sourceSampler,uv,0.0);}fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let ts=1.0/vec2f(textureDimensions(sourceTextureSampler));let l=smaaDetectLuma(color.rgb);let ll=smaaDetectLuma(smaaFetch(uv+vec2f(-ts.x,0.0)).rgb);let lt=smaaDetectLuma(smaaFetch(uv+vec2f(0.0,-ts.y)).rgb);let delta=vec2f(abs(l-ll),abs(l-lt));var edges=step(vec2f(smaaEdge.threshold),delta);if(edges.x+edges.y==0.0){return vec4f(0.0,0.0,0.0,1.0);}let lr=smaaDetectLuma(smaaFetch(uv+vec2f(ts.x,0.0)).rgb);let lb=smaaDetectLuma(smaaFetch(uv+vec2f(0.0,ts.y)).rgb);let ll2=smaaDetectLuma(smaaFetch(uv+vec2f(-2.0*ts.x,0.0)).rgb);let lt2=smaaDetectLuma(smaaFetch(uv+vec2f(0.0,-2.0*ts.y)).rgb);let d2=max(max(delta,vec2f(abs(l-lr),abs(l-lb))),vec2f(abs(ll-ll2),abs(lt-lt2)));let m=max(d2.x,d2.y);edges*=step(vec2f(m),2.0*delta);return vec4f(edges,0.0,1.0);}`;
var WEIGHT_UNIFORM_WGSL = `struct SmaaWeightParams{maxSearch:f32,diag:f32,corner:f32,pad:f32}@group(0)@binding(2)var<uniform>smaaWeight:SmaaWeightParams;`;
var WEIGHT_FRAGMENT_WGSL = `fn smaaEdgeAt(uv:vec2f)->vec2f{return textureSampleLevel(sourceTextureSampler,sourceSampler,uv,0.0).rg;}fn smaaBothEdges(uv:vec2f)->bool{let e=smaaEdgeAt(uv);return e.x>0.5&&e.y>0.5;}fn smaaDiagRunBoth(uv:vec2f,ts:vec2f,dir:vec2f,maxSteps:f32)->f32{var d=0.0;loop{if(d>=maxSteps){break;}if(!smaaBothEdges(uv+ts*dir*(d+1.0))){break;}d=d+1.0;}return d;}fn smaaDiagRunLeft(uv:vec2f,ts:vec2f,dir:vec2f,maxSteps:f32)->f32{var d=0.0;loop{if(d>=maxSteps){break;}if(smaaEdgeAt(uv+ts*dir*(d+1.0)).x<=0.5){break;}d=d+1.0;}return d;}fn smaaSearchX(uv:vec2f,ts:vec2f,dir:f32,maxSteps:f32,selfLeft:f32)->f32{var d=0.0;var behind=selfLeft;loop{if(d>=maxSteps){break;}if(dir<0.0&&behind>0.5){break;}let s=smaaEdgeAt(uv+vec2f(ts.x*dir*(d+1.0),0.0));if(dir>0.0&&s.x>0.5){break;}if(s.y<0.5){break;}behind=s.x;d=d+1.0;}return d;}fn smaaSearchY(uv:vec2f,ts:vec2f,dir:f32,maxSteps:f32,selfTop:f32)->f32{var d=0.0;var behind=selfTop;loop{if(d>=maxSteps){break;}if(dir<0.0&&behind>0.5){break;}let s=smaaEdgeAt(uv+vec2f(0.0,ts.y*dir*(d+1.0)));if(dir>0.0&&s.y>0.5){break;}if(s.x<0.5){break;}behind=s.y;d=d+1.0;}return d;}fn smaaHeight(x:f32,len:f32,cNear:f32,cFar:f32)->f32{let h=max(len*0.5,1e-4);if(x<h){return cNear*0.5*max(0.0,1.0-x/h);}return cFar*0.5*max(0.0,1.0-(len-x)/h);}fn smaaAccum(p:f32,q:f32,hp:f32,hq:f32)->vec2f{if(q<=p){return vec2f(0.0);}let w=q-p;if(hp*hq>=0.0){let a=0.5*(hp+hq)*w;return vec2f(max(a,0.0),max(-a,0.0));}let t=hp/(hp-hq);let a1=0.5*hp*(w*t);let a2=0.5*hq*(w*(1.0-t));return vec2f(max(a1,0.0)+max(a2,0.0),max(-a1,0.0)+max(-a2,0.0));}fn smaaResolveCrossings(cNear:vec2f,cFar:vec2f)->vec2f{let near=step(vec2f(0.5),cNear);let far=step(vec2f(0.5),cFar);let raw=vec2f(near.x-near.y,far.x-far.y);let nearBoth=near.x+near.y>1.5;let farBoth=far.x+far.y>1.5;return vec2f(select(raw.x,-raw.y,nearBoth&&abs(raw.y)>0.5),select(raw.y,-raw.x,farBoth&&abs(raw.x)>0.5));}fn smaaCoveragePair(x0:f32,len:f32,cNear:vec2f,cFar:vec2f)->vec2f{let crossing=smaaResolveCrossings(cNear,cFar);let x1=x0+1.0;let m=clamp(len*0.5,x0,x1);let h0=smaaHeight(x0,len,crossing.x,crossing.y);let hm=smaaHeight(m,len,crossing.x,crossing.y);let h1=smaaHeight(x1,len,crossing.x,crossing.y);return smaaAccum(x0,m,h0,hm)+smaaAccum(m,x1,hm,h1);}fn smaaCornerAttenuation(dNear:f32,dFar:f32)->vec2f{let nearest=vec2f(step(dNear,dFar),step(dFar,dNear));return 0.75*nearest/max(nearest.x+nearest.y,1.0);}fn smaaHorizontalCornerFactors(lEnd:vec2f,rEnd:vec2f,ts:vec2f,d1:f32,d2:f32)->vec2f{let attenuation=smaaCornerAttenuation(d1,d2);let below=vec2f(smaaEdgeAt(lEnd+vec2f(0.0,ts.y)).x,smaaEdgeAt(rEnd+vec2f(0.0,ts.y)).x);let above=vec2f(smaaEdgeAt(lEnd+vec2f(0.0,-2.0*ts.y)).x,smaaEdgeAt(rEnd+vec2f(0.0,-2.0*ts.y)).x);return clamp(vec2f(1.0-dot(attenuation,below),1.0-dot(attenuation,above)),vec2f(0.0),vec2f(1.0));}fn smaaVerticalCornerFactors(tEnd:vec2f,bEnd:vec2f,ts:vec2f,d1:f32,d2:f32)->vec2f{let attenuation=smaaCornerAttenuation(d1,d2);let right=vec2f(smaaEdgeAt(tEnd+vec2f(ts.x,0.0)).y,smaaEdgeAt(bEnd+vec2f(ts.x,0.0)).y);let left=vec2f(smaaEdgeAt(tEnd+vec2f(-2.0*ts.x,0.0)).y,smaaEdgeAt(bEnd+vec2f(-2.0*ts.x,0.0)).y);return clamp(vec2f(1.0-dot(attenuation,right),1.0-dot(attenuation,left)),vec2f(0.0),vec2f(1.0));}fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let ts=1.0/vec2f(textureDimensions(sourceTextureSampler));let e=color.rg;var w=vec4f(0.0);let maxSteps=smaaWeight.maxSearch;var diagonal=false;if(smaaWeight.diag>0.5){let minRun=smaaWeight.diag;if(e.x>0.5&&e.y>0.5){let a=smaaDiagRunBoth(uv,ts,vec2f(-1.0,1.0),maxSteps);let b=smaaDiagRunBoth(uv,ts,vec2f(1.0,-1.0),maxSteps);if(a+b+1.0>=minRun){w.x=0.5;diagonal=true;}}if(!diagonal&&e.x>0.5){let a=smaaDiagRunLeft(uv,ts,vec2f(-1.0,-1.0),maxSteps);let b=smaaDiagRunLeft(uv,ts,vec2f(1.0,1.0),maxSteps);if(a+b+1.0>=minRun){w.z=0.5;diagonal=true;}}}if(!diagonal&&e.y>0.5){let d1=smaaSearchX(uv,ts,-1.0,maxSteps,e.x);let d2=smaaSearchX(uv,ts,1.0,maxSteps,e.x);let len=d1+d2+1.0;let lEnd=uv+vec2f(-ts.x*d1,0.0);let rEnd=uv+vec2f(ts.x*(d2+1.0),0.0);let lCross=vec2f(smaaEdgeAt(lEnd).x,smaaEdgeAt(lEnd+vec2f(0.0,-ts.y)).x);let rCross=vec2f(smaaEdgeAt(rEnd).x,smaaEdgeAt(rEnd+vec2f(0.0,-ts.y)).x);var c=smaaCoveragePair(d1,len,lCross,rCross);if(smaaWeight.corner>0.5){c*=smaaHorizontalCornerFactors(lEnd,rEnd,ts,d1,d2);}w.x=c.x;w.y=c.y;}if(!diagonal&&e.x>0.5){let d1=smaaSearchY(uv,ts,-1.0,maxSteps,e.y);let d2=smaaSearchY(uv,ts,1.0,maxSteps,e.y);let len=d1+d2+1.0;let tEnd=uv+vec2f(0.0,-ts.y*d1);let bEnd=uv+vec2f(0.0,ts.y*(d2+1.0));let tCross=vec2f(smaaEdgeAt(tEnd).y,smaaEdgeAt(tEnd+vec2f(-ts.x,0.0)).y);let bCross=vec2f(smaaEdgeAt(bEnd).y,smaaEdgeAt(bEnd+vec2f(-ts.x,0.0)).y);var c=smaaCoveragePair(d1,len,tCross,bCross);if(smaaWeight.corner>0.5){c*=smaaVerticalCornerFactors(tEnd,bEnd,ts,d1,d2);}w.z=c.x;w.w=c.y;}return w;}`;
var NEIGHBOURHOOD_TEXTURE_WGSL = `@group(0)@binding(2)var smaaWeights:texture_2d<f32>;`;
var NEIGHBOURHOOD_UNIFORM_WGSL = `struct SmaaBlendParams{dominant:f32,p0:f32,p1:f32,p2:f32}@group(0)@binding(3)var<uniform>smaaBlend:SmaaBlendParams;`;
var NEIGHBOURHOOD_FRAGMENT_WGSL = `fn smaaFetch(uv:vec2f)->vec4f{return textureSampleLevel(sourceTextureSampler,sourceSampler,uv,0.0);}fn smaaWeightAt(uv:vec2f)->vec4f{return textureSampleLevel(smaaWeights,sourceSampler,uv,0.0);}fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let ts=1.0/vec2f(textureDimensions(sourceTextureSampler));let wSelf=smaaWeightAt(uv);let wBelow=smaaWeightAt(uv+vec2f(0.0,ts.y));let wRight=smaaWeightAt(uv+vec2f(ts.x,0.0));let up=wSelf.x;let down=wBelow.y;let left=wSelf.z;let right=wRight.w;if(up+down+left+right<1e-4){return color;}var bUp=up;var bDown=down;var bLeft=left;var bRight=right;if(smaaBlend.dominant>0.5){if(max(left,right)>max(up,down)){bUp=0.0;bDown=0.0;}else{bLeft=0.0;bRight=0.0;}}let sum=bUp+bDown+bLeft+bRight;if(sum<1e-4){return color;}var acc=vec4f(0.0);acc+=(bUp/sum)*mix(color,smaaFetch(uv+vec2f(0.0,-ts.y)),clamp(bUp,0.0,1.0));acc+=(bDown/sum)*mix(color,smaaFetch(uv+vec2f(0.0,ts.y)),clamp(bDown,0.0,1.0));acc+=(bLeft/sum)*mix(color,smaaFetch(uv+vec2f(-ts.x,0.0)),clamp(bLeft,0.0,1.0));acc+=(bRight/sum)*mix(color,smaaFetch(uv+vec2f(ts.x,0.0)),clamp(bRight,0.0,1.0));return acc;}`;
/** Resize a persistently-allocated intermediate target to match the source. */
function ensureTarget(rt, engine, width, height) {
	if (rt._eager && rt._width === width && rt._height === height) return;
	rt._eager = false;
	disposeRenderTarget(rt);
	rt._descriptor.size = {
		width,
		height
	};
	buildRenderTarget(rt, engine);
	rt._eager = true;
}
/** Resolve the current source size, including an unbuilt target's descriptor. */
function resolveSourceSize(source) {
	if (source._width > 0 && source._height > 0) return {
		width: source._width,
		height: source._height
	};
	const size = _resolveRenderTargetSize(source._descriptor);
	return {
		width: Math.max(1, size.width),
		height: Math.max(1, size.height)
	};
}
/** Hard ceiling on the pattern search, matching reference SMAA's maximum. The shader's loops
*  terminate against this value, so a non-finite or absurd one is not merely a bad setting: with
*  clamp-to-edge sampling an edge texel at the border repeats forever, and the loop never exits. */
var MAX_SEARCH_STEPS = 112;
/** Coerce a search length to a finite, in-range integer. */
function clampSearchSteps(value, fallback) {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.min(MAX_SEARCH_STEPS, Math.max(1, Math.floor(value)));
}
/** Shortest run the diagonal path will accept. Two is the floor: a single diagonal pixel is a dot,
*  not a 45-degree run, and claiming it produces an isolated blur. */
var MIN_DIAGONAL_RUN = 2;
/** Coerce a diagonal run length. Separate from clampSearchSteps only for the higher floor — the
*  constructor and the setter must agree, or a task can start in a state its own setter rejects. */
function clampDiagonalRun(value, fallback) {
	return Math.max(MIN_DIAGONAL_RUN, clampSearchSteps(value, fallback));
}
/** Coerce the edge threshold. A non-finite or negative value would make every pixel an edge (the
*  comparison is against a luma DIFFERENCE, which is never negative), turning the filter into a
*  full-screen blur; zero does the same. Reference SMAA's usable range tops out around 0.5. */
function clampThreshold(value, fallback) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
	return Math.min(.5, value);
}
/** @internal Exported for focused regression tests of open line ends and T-junctions. */
function _smaaResolveCrossingsForTests(near, far) {
	const nearBits = [near[0] >= .5 ? 1 : 0, near[1] >= .5 ? 1 : 0];
	const farBits = [far[0] >= .5 ? 1 : 0, far[1] >= .5 ? 1 : 0];
	const rawNear = nearBits[0] - nearBits[1];
	const rawFar = farBits[0] - farBits[1];
	return [nearBits[0] + nearBits[1] === 2 && rawFar !== 0 ? -rawFar : rawNear, farBits[0] + farBits[1] === 2 && rawNear !== 0 ? -rawNear : rawFar];
}
/**
* Create an SMAA (Subpixel Morphological Anti-Aliasing) post-process task.
*
* @param config - Source/target textures plus the edge threshold and search length.
* @param engine - The owning engine.
* @param scene - Optional owning scene. Omit for scene-less standalone frame graphs.
* @returns The SMAA task. Add it at the end of the frame-graph chain, after tone mapping.
*/
function createSmaaPostProcessTask(config, engine, scene) {
	const name = config.name ?? "smaa";
	const source = config.sourceTexture;
	const params = {
		threshold: clampThreshold(config.threshold, .05),
		sourceIsSrgb: config.sourceIsSrgb ?? false,
		dominantAxisBlend: config.dominantAxisBlend ?? true,
		maxSearchSteps: clampSearchSteps(config.maxSearchSteps, 16),
		diagonalDetection: config.diagonalDetection ?? false,
		minDiagonalRun: clampDiagonalRun(config.minDiagonalRun, 4),
		cornerDetection: config.cornerDetection ?? false
	};
	const edges = createRenderTarget({
		lbl: `${name}-edges`,
		format: "rgba8unorm",
		samples: 1,
		size: {
			width: 1,
			height: 1
		}
	});
	const weights = createRenderTarget({
		lbl: `${name}-weights`,
		format: "rgba8unorm",
		samples: 1,
		size: {
			width: 1,
			height: 1
		}
	});
	const edgeDetect = createPostProcessTask({
		name: `${name}-edges`,
		sourceTexture: source,
		targetTexture: edges,
		sourceSamplingMode: "linear",
		_shader: {
			fragmentWGSL: EDGE_FRAGMENT_WGSL,
			uniformWGSL: EDGE_UNIFORM_WGSL,
			uniformByteLength: 16,
			writeUniforms(data) {
				data[0] = params.threshold;
				data[1] = params.sourceIsSrgb ? 1 : 0;
			}
		}
	}, engine, scene);
	const blendWeights = createPostProcessTask({
		name: `${name}-weights`,
		sourceTexture: edges,
		targetTexture: weights,
		sourceSamplingMode: "nearest",
		_shader: {
			fragmentWGSL: WEIGHT_FRAGMENT_WGSL,
			uniformWGSL: WEIGHT_UNIFORM_WGSL,
			uniformByteLength: 16,
			writeUniforms(data) {
				data[0] = params.maxSearchSteps;
				data[1] = params.diagonalDetection ? params.minDiagonalRun : 0;
				data[2] = params.cornerDetection ? 1 : 0;
			}
		}
	}, engine, scene);
	const neighbourhood = createPostProcessTask({
		name: `${name}-blend`,
		sourceTexture: source,
		targetTexture: config.targetTexture,
		sourceSamplingMode: "linear",
		alphaMode: config.alphaMode,
		viewport: config.viewport,
		clear: config.clear,
		_shader: {
			fragmentWGSL: NEIGHBOURHOOD_FRAGMENT_WGSL,
			extraTextureWGSL: NEIGHBOURHOOD_TEXTURE_WGSL,
			extraTextures: [weights],
			uniformWGSL: NEIGHBOURHOOD_UNIFORM_WGSL,
			uniformByteLength: 16,
			writeUniforms(data) {
				data[0] = params.dominantAxisBlend ? 1 : 0;
			}
		}
	}, engine, scene);
	const task = {
		name,
		engine,
		scene,
		_passes: [],
		sourceTexture: source,
		sourceSamplingMode: config.sourceSamplingMode ?? "linear",
		targetTexture: config.targetTexture ?? null,
		alphaMode: config.alphaMode ?? 0,
		viewport: config.viewport ?? null,
		clear: config.clear ?? true,
		outputTexture: neighbourhood.outputTexture,
		edgesTexture: edges,
		weightsTexture: weights,
		get threshold() {
			return params.threshold;
		},
		set threshold(value) {
			params.threshold = clampThreshold(value, params.threshold);
		},
		get maxSearchSteps() {
			return params.maxSearchSteps;
		},
		set maxSearchSteps(value) {
			params.maxSearchSteps = clampSearchSteps(value, params.maxSearchSteps);
		},
		get diagonalDetection() {
			return params.diagonalDetection;
		},
		set diagonalDetection(value) {
			params.diagonalDetection = value;
		},
		get minDiagonalRun() {
			return params.minDiagonalRun;
		},
		set minDiagonalRun(value) {
			params.minDiagonalRun = clampDiagonalRun(value, params.minDiagonalRun);
		},
		get cornerDetection() {
			return params.cornerDetection;
		},
		set cornerDetection(value) {
			params.cornerDetection = value;
		},
		get sourceIsSrgb() {
			return params.sourceIsSrgb;
		},
		set sourceIsSrgb(value) {
			params.sourceIsSrgb = value;
		},
		get dominantAxisBlend() {
			return params.dominantAxisBlend;
		},
		set dominantAxisBlend(value) {
			params.dominantAxisBlend = value;
		},
		_edgeDetect: edgeDetect,
		_blendWeights: blendWeights,
		_neighbourhood: neighbourhood,
		_edges: edges,
		_weights: weights,
		record() {
			edgeDetect.sourceTexture = task.sourceTexture;
			neighbourhood.sourceTexture = task.sourceTexture;
			neighbourhood.targetTexture = task.targetTexture;
			neighbourhood.viewport = task.viewport;
			neighbourhood.clear = task.clear;
			neighbourhood.alphaMode = task.alphaMode;
			const src = task.sourceTexture;
			const { width: w, height: h } = resolveSourceSize(src);
			ensureTarget(edges, engine, w, h);
			ensureTarget(weights, engine, w, h);
			edgeDetect.record();
			blendWeights.record();
			neighbourhood.record();
			task.outputTexture = neighbourhood.outputTexture;
		},
		execute() {
			return (edgeDetect.execute?.() ?? 0) + (blendWeights.execute?.() ?? 0) + (neighbourhood.execute?.() ?? 0);
		},
		updateUniforms() {
			edgeDetect.updateUniforms();
			blendWeights.updateUniforms();
			neighbourhood.updateUniforms();
		},
		dispose() {
			edgeDetect.dispose();
			blendWeights.dispose();
			neighbourhood.dispose();
			edges._eager = false;
			weights._eager = false;
			disposeRenderTarget(edges);
			disposeRenderTarget(weights);
		}
	};
	return task;
}
export { _smaaResolveCrossingsForTests, createSmaaPostProcessTask };

//# sourceMappingURL=smaa.js.map