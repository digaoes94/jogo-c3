import { F32 } from "../engine/typed-arrays.js";
import { TU } from "../engine/gpu-flags.js";
import { computeDirectionalLightMatrix, createShadowParamsUBO, createSharedShadowUBO } from "./shadow-base.js";
import { ensurePcfShadowTaskState, preloadPcfShadowTaskState, renderPcfShadowMap } from "./pcf-shadow-task-hooks.js";
// src/shadow/pcf-directional-shadow-generator.ts
/** PCF Shadow Generator for Directional Lights.
*
*  Same on-shader PCF5 sampling as `pcf-spotlight-shadow-generator.ts`, but with an
*  orthographic light projection fit to the caster AABBs — matching Babylon's
*  DirectionalLight + `usePercentageCloserFiltering=true` configuration.
*
*  Everything downstream of the projection (depth-only pipeline, comparison
*  sampler, shared UBOs, dirty tracking) is identical to the spot-light PCF
*  path. The only differences are:
*    1. The projection matrix (ortho vs perspective).
*    2. The projection bounds auto-fit based on casters' world AABBs.
*
*  Exported separately so scenes that only use spot-PCF don't pull in the
*  directional AABB-fit code path, and so the API parallels the ESM split
*  (`createEsmDirectionalShadowGenerator` → directional ESM, `createPcfSpotlightShadowGenerator` → spot PCF).
*/
/**
* Creates a PCF (percentage-closer filtering) shadow generator for a directional light,
* using an orthographic projection auto-fit to the caster meshes' world AABBs.
* @param engine - The engine providing the GPU device.
* @param _light - The directional light that casts the shadows.
* @param cfg - Optional shadow-map and projection configuration.
* @returns A `ShadowGenerator` wired to the directional PCF render path.
*/
function createPcfDirectionalShadowGenerator(engine, _light, cfg = {}) {
	const device = engine._device;
	const mapSize = cfg.mapSize ?? 1024;
	const bias = cfg.bias ?? 5e-5;
	const darkness = cfg.darkness ?? 0;
	const orthoMinZ = cfg.orthoMinZ ?? 1;
	const orthoMaxZ = cfg.orthoMaxZ ?? 1e4;
	const forceRefreshEveryFrame = cfg.forceRefreshEveryFrame ?? false;
	const _lightMatrix = new F32(16);
	const _shadowsInfo = new F32([
		darkness,
		mapSize,
		1 / mapSize,
		0
	]);
	const _depthValues = new F32([0, 1]);
	const { ubo: _shadowUBO } = createSharedShadowUBO(engine, _lightMatrix, _depthValues, _shadowsInfo);
	const _config = {
		_mapSize: mapSize,
		_bias: bias,
		_forceRefreshEveryFrame: forceRefreshEveryFrame,
		_orthoMinZ: orthoMinZ,
		_orthoMaxZ: orthoMaxZ
	};
	const sg = {
		_shadowType: "pcf",
		_light,
		_depthTexture: device.createTexture({
			size: {
				width: mapSize,
				height: mapSize
			},
			format: "depth32float",
			usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING
		}),
		_depthSampler: device.createSampler({
			compare: "less",
			magFilter: "linear",
			minFilter: "linear"
		}),
		_lightMatrix,
		_shadowsInfo,
		_depthValues,
		_shadowParamsUBO: createShadowParamsUBO(engine, bias, 1 / mapSize),
		_shadowUBO,
		_config,
		_version: 0
	};
	sg._preloadShadowTask = preloadPcfShadowTaskState;
	sg._ensureShadowTaskState = (engine, scene, casterMeshes) => {
		const state = ensurePcfShadowTaskState(engine, scene, sg, casterMeshes, sg._shadowTaskState ?? null);
		sg._shadowTaskState = state;
		return state;
	};
	sg._renderShadowMap = (engine, state) => {
		return renderPcfShadowMap(engine, sg, state, (casterMeshes, offX, offY, offZ) => computeDirectionalLightMatrix(_light, casterMeshes, orthoMinZ, orthoMaxZ, offX, offY, offZ));
	};
	return sg;
}
export { createPcfDirectionalShadowGenerator };

//# sourceMappingURL=pcf-directional-shadow-generator.js.map