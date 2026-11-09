import { createPostProcessTask } from "../frame-graph/post-process-task.js";
// src/post-process/depth-of-field-merge.ts
function buildMergeExtraTextureWGSL(blurLevel) {
	let source = `@group(0)@binding(2)var dofCocTexture:texture_2d<f32>;@group(0)@binding(3)var blurStep0:texture_2d<f32>;`;
	if (blurLevel > 0) source = `${source}@group(0)@binding(4)var blurStep1:texture_2d<f32>;`;
	if (blurLevel > 1) source = `${source}@group(0)@binding(5)var blurStep2:texture_2d<f32>;`;
	return source;
}
function buildMergeFragmentWGSL(blurLevel) {
	const head = `fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let coc=textureSampleLevel(dofCocTexture,sourceSampler,uv,0.0).r;let blurred0=textureSampleLevel(blurStep0,sourceSampler,uv,0.0);`;
	if (blurLevel === 0) return `${head}return mix(color,blurred0,coc);}`;
	if (blurLevel === 1) return `${head} let blurred1=textureSampleLevel(blurStep1,sourceSampler,uv,0.0);if(coc<0.5){return mix(color,blurred1,coc/0.5);}return mix(blurred1,blurred0,(coc-0.5)/0.5);}`;
	return `${head} let blurred1=textureSampleLevel(blurStep1,sourceSampler,uv,0.0);let blurred2=textureSampleLevel(blurStep2,sourceSampler,uv,0.0);if(coc<0.33){return mix(color,blurred2,coc/0.33);}if(coc<0.66){return mix(blurred2,blurred1,(coc-0.33)/0.33);}return mix(blurred1,blurred0,(coc-0.66)/0.34);}`;
}
/**
* Create a depth-of-field merge post-process task. For each pixel it picks the
* appropriate blur step(s) based on the circle-of-confusion and blends them
* with the sharp original, giving a smooth transition from in-focus to fully
* blurred. The blur level (0/1/2) is derived from `blurSteps.length - 1`.
*
* @internal
* @param config - Original source, CoC texture, blur steps, and target settings.
* @param engine - The owning engine.
* @param scene - Optional owning scene. Omit for scene-less standalone frame graphs.
* @returns The depth-of-field merge post-process task.
*/
function createDepthOfFieldMergePostProcessTask(config, engine, scene) {
	const blurLevel = config.blurSteps.length - 1;
	const extraTextures = [config.circleOfConfusionTexture];
	for (let i = config.blurSteps.length - 1; i >= 0; i--) extraTextures.push(config.blurSteps[i]);
	return createPostProcessTask({
		name: config.name ?? "depth-of-field-merge",
		sourceTexture: config.sourceTexture,
		sourceSamplingMode: config.sourceSamplingMode ?? "linear",
		targetTexture: config.targetTexture,
		alphaMode: config.alphaMode,
		viewport: config.viewport,
		clear: config.clear,
		_shader: {
			extraTextureWGSL: buildMergeExtraTextureWGSL(blurLevel),
			extraTextures,
			fragmentWGSL: buildMergeFragmentWGSL(blurLevel)
		}
	}, engine, scene);
}
export { createDepthOfFieldMergePostProcessTask };

//# sourceMappingURL=depth-of-field-merge.js.map