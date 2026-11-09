import { F32 } from "../engine/typed-arrays.js";
import { TU } from "../engine/gpu-flags.js";
import { buildLightViewMatrix, createShadowParamsUBO, createSharedShadowUBO, multiply4x4 } from "./shadow-base.js";
import { ensurePcfShadowTaskState, preloadPcfShadowTaskState, renderPcfShadowMap } from "./pcf-shadow-task-hooks.js";
// src/shadow/pcf-spotlight-shadow-generator.ts
/**
* PCF Shadow Generator — Percentage Closer Filtering for spot lights.
*
* Pipeline (per frame):
*   1. Render shadow casters to depth-only texture from light's perspective
*   2. Main-pass fragment shader samples depth with comparison sampler (PCF5 — 5×5 bilinear)
*
* Compared to the ESM generator:
*   - No blur passes (saves 2 draw calls + 2 GPU textures)
*   - depth32float depth-only texture (no rgba16float color)
*   - Smaller shadow maps work well (512 default)
*   - Uses hardware depth comparison + averaging for soft edges
*
* Matches Babylon.js ShadowGenerator with:
*   - usePercentageCloserFiltering = true (SM_PCF / shadow5 quality)
*/
/** @internal Compute the PCF spot-light view/projection matrix for ShadowTask.
*  Under floating-origin (`offX/offY/offZ` ≠ 0) the light view is built eye-relative
*  (offset subtracted from the spot position) so the returned view/viewProj match the
*  eye-relative mesh world matrices used by both the caster pass and the receiver shader. */
function _computeSpotLightMatrix(light, near, far, offX = 0, offY = 0, offZ = 0) {
	const world = light.worldMatrix;
	const direction = light.direction;
	const dx = world[0] * direction.x + world[4] * direction.y + world[8] * direction.z;
	const dy = world[1] * direction.x + world[5] * direction.y + world[9] * direction.z;
	const dz = world[2] * direction.x + world[6] * direction.y + world[10] * direction.z;
	const view = buildLightViewMatrix(dx, dy, dz, world[12] - offX, world[13] - offY, world[14] - offZ);
	const f = 1 / Math.tan(light.angle * .5);
	const proj = new F32(16);
	proj[0] = f;
	proj[5] = f;
	proj[10] = far / (far - near);
	proj[11] = 1;
	proj[14] = -(far * near) / (far - near);
	return {
		_view: view,
		_viewProj: multiply4x4(proj, view),
		_near: near,
		_far: far
	};
}
/**
* Creates a PCF (percentage-closer filtering) shadow generator for a spot light, using a
* perspective projection derived from the light's cone angle.
* @param engine - The engine providing the GPU device.
* @param _light - The spot light that casts the shadows.
* @param cfg - Optional shadow-map and projection configuration.
* @returns A `ShadowGenerator` wired to the spot-light PCF render path.
*/
function createPcfSpotlightShadowGenerator(engine, _light, cfg = {}) {
	const device = engine._device;
	const mapSize = cfg.mapSize ?? 512;
	const bias = cfg.bias ?? 5e-5;
	const darkness = cfg.darkness ?? 0;
	const near = cfg.near ?? 1;
	const far = cfg.far ?? (_light.range === Number.MAX_VALUE ? 1e4 : _light.range);
	const _depthTexture = device.createTexture({
		size: {
			width: mapSize,
			height: mapSize
		},
		format: "depth32float",
		usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING
	});
	const _depthSampler = device.createSampler({
		compare: "less",
		magFilter: "linear",
		minFilter: "linear"
	});
	const _shadowParamsUBO = createShadowParamsUBO(engine, bias, 1 / mapSize);
	const _lightMatrix = new F32(16);
	const _shadowsInfo = new F32([
		darkness,
		mapSize,
		1 / mapSize,
		0
	]);
	const _depthValues = new F32([0, far]);
	const { ubo: _shadowUBO } = createSharedShadowUBO(engine, _lightMatrix, _depthValues, _shadowsInfo);
	const sg = {
		_shadowType: "pcf",
		_light,
		_depthTexture,
		_depthSampler,
		_lightMatrix,
		_shadowsInfo,
		_depthValues,
		_shadowParamsUBO,
		_shadowUBO,
		_config: {
			_mapSize: mapSize,
			_bias: bias,
			_forceRefreshEveryFrame: cfg.forceRefreshEveryFrame ?? false
		},
		_version: 0
	};
	sg._preloadShadowTask = preloadPcfShadowTaskState;
	sg._ensureShadowTaskState = (engine, scene, casterMeshes) => {
		const state = ensurePcfShadowTaskState(engine, scene, sg, casterMeshes, sg._shadowTaskState ?? null);
		sg._shadowTaskState = state;
		return state;
	};
	sg._renderShadowMap = (engine, state) => {
		return renderPcfShadowMap(engine, sg, state, (_casterMeshes, offX, offY, offZ) => _computeSpotLightMatrix(_light, near, far, offX, offY, offZ));
	};
	return sg;
}
export { _computeSpotLightMatrix, createPcfSpotlightShadowGenerator };

//# sourceMappingURL=pcf-spotlight-shadow-generator.js.map