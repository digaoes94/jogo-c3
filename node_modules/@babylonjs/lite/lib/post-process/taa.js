import { F32 } from "../engine/typed-arrays.js";
import { _cameraChangeKey } from "../camera/camera.js";
import { _resolveRenderTargetSize, buildRenderTarget, createRenderTarget, disposeRenderTarget } from "../engine/render-target.js";
import { createPostProcessTask } from "../frame-graph/post-process-task.js";
// src/post-process/taa.ts
var TAA_HISTORY_TEXTURE_WGSL = `@group(0)@binding(2)var taaHistory:texture_2d<f32>;`;
var TAA_UNIFORM_WGSL = `struct TaaParams{factor:f32,p0:f32,p1:f32,p2:f32}@group(0)@binding(3)var<uniform>taaParams:TaaParams;`;
var TAA_FRAGMENT_WGSL = `fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let h=textureSample(taaHistory,sourceSampler,uv);return mix(h,color,taaParams.factor);}`;
var TAA_COPY_FRAGMENT_WGSL = `fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{return color;}`;
/**
* Create a Temporal Anti-Aliasing post-process task.
* @param config - Source texture + source render task, blend factor, sample count.
* @param engine - The owning engine.
* @param scene - Optional owning scene.
* @returns The TAA post-process task. Add it at the end of the frame-graph chain.
*/
function createTaaPostProcessTask(config, engine, scene) {
	const name = config.name ?? "taa";
	const source = config.sourceTexture;
	const target = config.targetTexture ?? null;
	const samples = Math.max(1, Math.floor(config.samples ?? 8));
	const sizeRef = source._descriptor.size;
	const history = createRenderTarget({
		lbl: `${name}-history`,
		format: "rgba16float",
		samples: 1,
		size: sizeRef
	});
	const temp = createRenderTarget({
		lbl: `${name}-temp`,
		format: "rgba16float",
		samples: 1,
		size: sizeRef
	});
	const blend = createPostProcessTask({
		name: `${name}-blend`,
		sourceTexture: source,
		sourceSamplingMode: "nearest",
		targetTexture: temp,
		_shader: {
			extraTextureWGSL: TAA_HISTORY_TEXTURE_WGSL,
			extraTextures: [history],
			uniformWGSL: TAA_UNIFORM_WGSL,
			uniformBinding: 3,
			uniformByteLength: 16,
			writeUniforms(data) {
				data[0] = task._factor;
			},
			fragmentWGSL: TAA_FRAGMENT_WGSL
		}
	}, engine, scene);
	const present = createPostProcessTask({
		name: `${name}-present`,
		sourceTexture: temp,
		sourceSamplingMode: "nearest",
		targetTexture: target ?? engine.scRT,
		_shader: { fragmentWGSL: TAA_COPY_FRAGMENT_WGSL }
	}, engine, scene);
	const historyUpdate = createPostProcessTask({
		name: `${name}-history-update`,
		sourceTexture: temp,
		sourceSamplingMode: "nearest",
		targetTexture: history,
		_shader: { fragmentWGSL: TAA_COPY_FRAGMENT_WGSL }
	}, engine, scene);
	const task = {
		name,
		engine,
		scene,
		_passes: [],
		sourceTexture: source,
		targetTexture: target,
		outputTexture: target ?? engine.scRT,
		factor: config.factor ?? .05,
		samples,
		disableOnCameraMove: config.disableOnCameraMove ?? true,
		_blend: blend,
		_present: present,
		_historyUpdate: historyUpdate,
		_history: history,
		_temp: temp,
		_sourceRenderTask: config.sourceRenderTask,
		_halton: generateHalton(samples),
		_haltonIndex: 0,
		_jitterScratch: new F32(16),
		_firstUpdate: true,
		_lastCamVer: -1,
		_factor: 1,
		record() {
			const { width: w, height: h } = resolveSourceSize(task.sourceTexture);
			ensurePersistentTarget(history, engine, w, h);
			ensurePersistentTarget(temp, engine, w, h);
			blend.record();
			present.record();
			historyUpdate.record();
			task._firstUpdate = true;
			task._haltonIndex = 0;
			task._lastCamVer = -1;
		},
		execute() {
			const src = task._sourceRenderTask;
			const cam = src._config.cam ?? src.scene.camera;
			const camVer = cam ? _cameraChangeKey(cam) : 0;
			const moved = camVer !== task._lastCamVer || cam !== task._lastCam;
			task._lastCamVer = camVer;
			task._lastCam = cam;
			const reset = task._firstUpdate || moved && task.disableOnCameraMove;
			task._factor = reset ? 1 : task.factor;
			blend.updateUniforms();
			let draws = blend.execute?.() ?? 0;
			draws += present.execute?.() ?? 0;
			draws += historyUpdate.execute?.() ?? 0;
			task._firstUpdate = false;
			advanceJitter(task);
			return draws;
		},
		updateUniforms() {
			blend.updateUniforms();
		},
		dispose() {
			task._passes.length = 0;
			blend.dispose();
			present.dispose();
			historyUpdate.dispose();
			history._eager = false;
			temp._eager = false;
			disposeRenderTarget(history);
			disposeRenderTarget(temp);
		}
	};
	return task;
}
/** Allocate (or, on a size change, reallocate) a persistent ping-pong target sized
*  `width`×`height`. The target is marked `_eager` so the post-process sub-tasks'
*  internal `buildRenderTarget` no-ops on it, keeping accumulated history alive across
*  frames and preventing a rebuild from destroying a texture still bound elsewhere. */
function ensurePersistentTarget(rt, engine, width, height) {
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
/** Resolve a render target's pixel size: prefer its allocated dimensions, falling back
*  to the descriptor's surface (multi-surface safe — does not assume the engine canvas)
*  or explicit pixel size before the target has been built. */
function resolveSourceSize(source) {
	if (source._width > 0 && source._height > 0) return {
		width: source._width,
		height: source._height
	};
	return _resolveRenderTargetSize(source._descriptor);
}
/** Generate `samples` 2D Halton offsets (base 2 / base 3) centered on [-0.5, 0.5). */
function generateHalton(samples) {
	const seq = new F32(samples * 2);
	for (let i = 1; i <= samples; i++) {
		seq[(i - 1) * 2] = halton(i, 2) - .5;
		seq[(i - 1) * 2 + 1] = halton(i, 3) - .5;
	}
	return seq;
}
function halton(index, base) {
	let fraction = 1;
	let result = 0;
	while (index > 0) {
		fraction /= base;
		result += fraction * (index % base);
		index = Math.floor(index / base);
	}
	return result;
}
/** Advance the Halton sequence and overwrite the source task's viewProjection
*  (column-major bytes 0..63 of its scene UBO) with a sub-pixel jittered matrix. */
function advanceJitter(task) {
	const src = task._sourceRenderTask;
	const clean = src._suData;
	const w = task.sourceTexture._width;
	const h = task.sourceTexture._height;
	if (w <= 0 || h <= 0) return;
	const jx = task._halton[task._haltonIndex] / (w / 2);
	const jy = task._halton[task._haltonIndex + 1] / (h / 2);
	task._haltonIndex += 2;
	if (task._haltonIndex >= task._halton.length) task._haltonIndex = 0;
	const out = task._jitterScratch;
	for (let c = 0; c < 4; c++) {
		const b = c * 4;
		const w3 = clean[b + 3];
		out[b] = clean[b] + jx * w3;
		out[b + 1] = clean[b + 1] + jy * w3;
		out[b + 2] = clean[b + 2];
		out[b + 3] = w3;
	}
	task.engine._device.queue.writeBuffer(src._sceneUBO, 0, out);
}
export { createTaaPostProcessTask };

//# sourceMappingURL=taa.js.map