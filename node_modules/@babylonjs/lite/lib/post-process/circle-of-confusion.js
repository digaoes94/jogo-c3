import { createPostProcessTask } from "../frame-graph/post-process-task.js";
import { _rightHanded } from "#coordinate-system";
// src/post-process/circle-of-confusion.ts
var COC_EXTRA_TEXTURE_WGSL = `@group(0)@binding(2)var cocDepthTexture:texture_2d<f32>;`;
var COC_UNIFORM_WGSL = `struct CircleOfConfusionParams{focusDistance:f32,cocPrecalculation:f32,minZ:f32,maxZRange:f32}@group(0)@binding(3)var<uniform>cocParams:CircleOfConfusionParams;`;
/** Builds the fragment body. The only difference between normalized and
*  camera-space depth is how `pixelDistance` is reconstructed. See the BJS
*  `circleOfConfusion.fragment` shader. A right-handed VIEW_DEPTH is the
*  signed (negative) camera-space z, so it is negated back to a distance. */
function cocFragmentWGSL(depthNotNormalized) {
	return `fn applyPostProcess(color:vec4f,uv:vec2f)->vec4f{let depth=textureSample(cocDepthTexture,sourceSampler,uv).r;let pixelDistance=${depthNotNormalized ? _rightHanded ? `-depth*1000.0` : `depth*1000.0` : `(cocParams.minZ+cocParams.maxZRange*depth)*1000.0`};var coc=abs(cocParams.cocPrecalculation*((cocParams.focusDistance-pixelDistance)/pixelDistance));coc=clamp(coc,0.0,1.0);return vec4f(coc,coc,coc,1.0);}`;
}
/**
* Create a circle-of-confusion post-process task. The output is a grayscale map
* where 0 = in focus and 1 = maximally out of focus, computed from the supplied
* depth texture and the lens parameters (the usual first stage of a depth-of-field
* pipeline). See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html.
*
* @param config - Depth texture, camera, lens parameters and source/target settings.
* @param engine - The owning engine.
* @param scene - Optional owning scene. Omit for scene-less standalone frame graphs.
* @returns The circle-of-confusion post-process task.
*/
function createCircleOfConfusionPostProcessTask(config, engine, scene) {
	const params = {
		lensSize: config.lensSize ?? 50,
		fStop: config.fStop ?? 1.4,
		focusDistance: config.focusDistance ?? 2e3,
		focalLength: config.focalLength ?? 50
	};
	const camera = config.camera;
	const depthNotNormalized = config.depthNotNormalized ?? false;
	const task = createPostProcessTask({
		name: config.name ?? "circle-of-confusion",
		sourceTexture: config.sourceTexture,
		sourceSamplingMode: config.sourceSamplingMode ?? "linear",
		targetTexture: config.targetTexture,
		alphaMode: config.alphaMode,
		viewport: config.viewport,
		clear: config.clear,
		_shader: {
			extraTextures: [config.depthTexture],
			extraTextureWGSL: COC_EXTRA_TEXTURE_WGSL,
			uniformWGSL: COC_UNIFORM_WGSL,
			uniformByteLength: 16,
			writeUniforms(data) {
				const aperture = params.lensSize / params.fStop;
				data[0] = params.focusDistance;
				data[1] = aperture * params.focalLength / (params.focusDistance - params.focalLength);
				data[2] = camera.nearPlane;
				data[3] = camera.farPlane - camera.nearPlane;
			},
			fragmentWGSL: cocFragmentWGSL(depthNotNormalized)
		}
	}, engine, scene);
	Object.defineProperties(task, {
		lensSize: {
			get: () => params.lensSize,
			set: (v) => params.lensSize = v
		},
		fStop: {
			get: () => params.fStop,
			set: (v) => params.fStop = v
		},
		focusDistance: {
			get: () => params.focusDistance,
			set: (v) => params.focusDistance = v
		},
		focalLength: {
			get: () => params.focalLength,
			set: (v) => params.focalLength = v
		}
	});
	return task;
}
export { createCircleOfConfusionPostProcessTask };

//# sourceMappingURL=circle-of-confusion.js.map