import { F32, U32 } from "../engine/typed-arrays.js";
import { createUniformBuffer } from "../resource/uniform-buffer.js";
import { MAX_LIGHTS } from "../light/types.js";
// src/render/scene-lights-ubo.ts
/** Shared lights UBO helpers — used by both Standard and PBR pipelines.
*
*  UBO layout: 16-byte header (u32 count + 3×u32 padding) followed by
*  up to MAX_LIGHTS × LightEntry (4 × vec4 = 64 bytes each).
*  Default total: 16 + 16 × 64 = 1040 bytes. */
/** Reusable typed-array pair for writing a u32 count as its float32 bit pattern.
*  Avoids allocating a Uint32Array view on every fillLightsData call. */
var _countU32 = new U32(1);
var _countF32 = new F32(_countU32.buffer);
/** @internal
* Total byte size of the lights UBO (header + MAX_LIGHTS entries).
* Recomputed dynamically because MAX_LIGHTS is mutable via `setMaxLights`. */
function getLightsUboSize() {
	return 16 + MAX_LIGHTS * 16 * 4;
}
/** Compute a composite version from all lights (sum of _lightVersion).
*  Returns 0 for lights without version tracking (always refresh). */
function computeLightsVersion(lights) {
	let v = 0;
	for (const light of lights) v += light._lightVersion ?? 0;
	return v;
}
/** Fill a Float32Array with standard light data. Reused by create and refresh
*  paths. World-space light positions are written precision-only; under
*  floating origin the active-camera offset is subtracted afterwards by
*  `engine._applyLightFoOffset` (kept out of non-LWR bundles). */
function fillLightsData(data, lights) {
	data.fill(0);
	let count = 0;
	const headerFloats = 4;
	for (const light of lights) {
		if (count >= MAX_LIGHTS) break;
		if (!light._writeLightUbo) continue;
		light._writeLightUbo(data, headerFloats + count * 16);
		count++;
	}
	_countU32[0] = count;
	data[0] = _countF32[0];
}
/** @internal */
function ensureSceneLightState(engine, scene) {
	let state = scene._lightGpuState;
	const byteSize = getLightsUboSize();
	if (state && state._byteSize === byteSize) return state;
	const registerDisposer = !state;
	state?._buffer.destroy();
	const scratch = new F32(byteSize / 4);
	fillLightsData(scratch, scene.lights);
	engine._applyLightFoOffset?.(scratch, scene);
	state = {
		_buffer: createUniformBuffer(engine, scratch),
		_scratch: scratch,
		_version: computeLightsVersion(scene.lights) + (engine._lightFoVersion?.(scene) ?? 0),
		_listVersion: scene._lightListVersion ?? 0,
		_lightCount: scene.lights.length,
		_byteSize: byteSize
	};
	scene._lightGpuState = state;
	if (registerDisposer) scene._disposables.push(() => {
		scene._lightGpuState?._buffer.destroy();
		scene._lightGpuState = void 0;
	});
	return state;
}
/** @internal */
function refreshSceneLightsUBO(engine, scene) {
	const state = ensureSceneLightState(engine, scene);
	const version = computeLightsVersion(scene.lights) + (engine._lightFoVersion?.(scene) ?? 0);
	const listVersion = scene._lightListVersion ?? 0;
	if (version !== state._version || listVersion !== state._listVersion || scene.lights.length !== state._lightCount) {
		state._version = version;
		state._listVersion = listVersion;
		state._lightCount = scene.lights.length;
		fillLightsData(state._scratch, scene.lights);
		engine._applyLightFoOffset?.(state._scratch, scene);
		engine._device.queue.writeBuffer(state._buffer, 0, state._scratch);
	}
	return state._buffer;
}
/** @internal Fill `data` with the light-UBO contents for `foScene.lights`, then
*  subtract the floating-origin offset of `foScene.camera` (a no-op for non-LWR
*  engines, where `engine._applyLightFoOffset` is undefined). Reuses the same
*  `fillLightsData` + `applyLightFoOffset` pipeline as the shared scene lights
*  state, but lets a caller supply a DIFFERENT camera/lights source. The
*  geometry-renderer task uses this to build a lights UBO relative to a
*  `config.camera` override so positional light data shares the same origin as
*  its origin-relative world/view packing — without perturbing the scene's
*  shared lights state (which stays relative to the scene's active camera). */
function _writeTaskLightsData(engine, data, foScene) {
	fillLightsData(data, foScene.lights);
	engine._applyLightFoOffset?.(data, foScene);
}
export { _writeTaskLightsData, ensureSceneLightState, getLightsUboSize, refreshSceneLightsUBO };

//# sourceMappingURL=scene-lights-ubo.js.map