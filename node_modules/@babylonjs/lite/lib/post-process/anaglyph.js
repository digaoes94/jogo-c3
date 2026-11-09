import { createPostProcessTask } from "../frame-graph/post-process-task.js";
// src/post-process/anaglyph.ts
var ANAGLYPH_EXTRA_TEXTURE_WGSL = `@group(0)@binding(2)var leftTextureSampler:texture_2d<f32>;`;
var ANAGLYPH_FRAGMENT_WGSL = `fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let l=textureSampleLevel(leftTextureSampler,sourceSampler,clamp(uv,vec2f(0),vec2f(1)),0);let left=vec4f(1,l.g,l.b,1);let right=vec4f(color.r,1,1,1);return vec4f(right.rgb*left.rgb,1);}`;
/**
* Create a post-process task that merges a left-eye texture with the source (right eye) into a red/cyan anaglyph.
* @param config - Source/target settings and the left-eye `leftTexture`.
* @param engine - The owning engine.
* @param scene - Optional owning scene. Omit for scene-less standalone frame graphs.
* @returns The anaglyph post-process task.
*/
function createAnaglyphPostProcessTask(config, engine, scene) {
	const task = createPostProcessTask({
		name: config.name ?? "anaglyph",
		sourceTexture: config.sourceTexture,
		sourceSamplingMode: config.sourceSamplingMode,
		targetTexture: config.targetTexture,
		alphaMode: config.alphaMode,
		viewport: config.viewport,
		clear: config.clear,
		_shader: {
			extraTextureWGSL: ANAGLYPH_EXTRA_TEXTURE_WGSL,
			extraTextures: [config.leftTexture],
			fragmentWGSL: ANAGLYPH_FRAGMENT_WGSL
		}
	}, engine, scene);
	task.leftTexture = config.leftTexture;
	return task;
}
export { createAnaglyphPostProcessTask };

//# sourceMappingURL=anaglyph.js.map