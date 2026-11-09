import { createPostProcessTask } from "../frame-graph/post-process-task.js";
// src/post-process/extract-highlights.ts
var TO_GAMMA_SPACE = 1 / 2.2;
var EXTRACT_HIGHLIGHTS_UNIFORM_WGSL = `struct ExtractHighlightsParams{threshold:f32,exposure:f32,p0:f32,p1:f32}@group(0)@binding(2)var<uniform>extractHighlightsParams:ExtractHighlightsParams;`;
var EXTRACT_HIGHLIGHTS_FRAGMENT_WGSL = `fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let luma=dot(vec3f(0.2126,0.7152,0.0722),color.rgb*extractHighlightsParams.exposure);return vec4f(step(extractHighlightsParams.threshold,luma)*color.rgb,color.a);}`;
/**
* Create a post-process task that isolates bright highlights above a luminance threshold (used as the first stage of bloom).
* @param config - Threshold/exposure parameters and source/target settings.
* @param engine - The owning engine.
* @param scene - Optional owning scene. Omit for scene-less standalone frame graphs.
* @returns The extract-highlights post-process task.
*/
function createExtractHighlightsPostProcessTask(config, engine, scene) {
	const params = {
		threshold: config.threshold ?? .9,
		exposure: config.exposure ?? 1
	};
	const task = createPostProcessTask({
		name: config.name ?? "extract-highlights",
		sourceTexture: config.sourceTexture,
		sourceSamplingMode: config.sourceSamplingMode,
		targetTexture: config.targetTexture,
		alphaMode: config.alphaMode,
		viewport: config.viewport,
		clear: config.clear,
		_shader: {
			uniformWGSL: EXTRACT_HIGHLIGHTS_UNIFORM_WGSL,
			uniformByteLength: 16,
			writeUniforms(data) {
				data[0] = Math.pow(params.threshold, TO_GAMMA_SPACE);
				data[1] = params.exposure;
			},
			fragmentWGSL: EXTRACT_HIGHLIGHTS_FRAGMENT_WGSL
		}
	}, engine, scene);
	Object.defineProperties(task, {
		threshold: {
			get: () => params.threshold,
			set: (value) => {
				params.threshold = value;
			}
		},
		exposure: {
			get: () => params.exposure,
			set: (value) => {
				params.exposure = value;
			}
		}
	});
	return task;
}
export { createExtractHighlightsPostProcessTask };

//# sourceMappingURL=extract-highlights.js.map