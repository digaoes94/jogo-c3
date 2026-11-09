// src/shadow/enable-csm-static-cache.ts
var enabling = null;
/**
* Enables the opt-in static/dynamic caster cache for a CSM generator.
*
* Call and await this before registering the scene or requesting the generator's
* receiver texture. The cache implementation is dynamically imported, so CSM scenes
* that do not call this function fetch none of its code.
*/
function enableCsmStaticCache(engine, sg, options) {
	if (sg._shadowType !== "csm") return Promise.reject(/* @__PURE__ */ new Error("enableCsmStaticCache requires a CSM shadow generator"));
	if (!Number.isFinite(options.refitAngle) || options.refitAngle <= 0) return Promise.reject(/* @__PURE__ */ new RangeError("enableCsmStaticCache requires a positive finite refitAngle"));
	const staticCascadesPerFrame = options.staticCascadesPerFrame ?? 0;
	if (!Number.isInteger(staticCascadesPerFrame) || staticCascadesPerFrame < 0) return Promise.reject(/* @__PURE__ */ new RangeError("enableCsmStaticCache requires a non-negative integer staticCascadesPerFrame"));
	const cascadeCoveragePadding = options.cascadeCoveragePadding ?? 0;
	if (!Number.isFinite(cascadeCoveragePadding) || cascadeCoveragePadding < 0 || cascadeCoveragePadding > 1) return Promise.reject(/* @__PURE__ */ new RangeError("enableCsmStaticCache requires a cascadeCoveragePadding between 0 and 1"));
	if (cascadeCoveragePadding > 0 && !sg._config._stabilizeCascades) return Promise.reject(/* @__PURE__ */ new Error("enableCsmStaticCache cascadeCoveragePadding requires stabilizeCascades"));
	if (cascadeCoveragePadding > 0 && cascadeCoveragePadding < 2 / sg._config._mapSize) return Promise.reject(/* @__PURE__ */ new RangeError("enableCsmStaticCache requires a cascadeCoveragePadding of at least 2 / mapSize"));
	if (sg._shadowTaskState || sg._csmReceiverTexture || engine.surfaces.some((surface) => surface._renderingContexts.length > 0)) return Promise.reject(/* @__PURE__ */ new Error("enableCsmStaticCache must run before scene registration and receiver texture access"));
	if (sg._csmCache?._loaded) return Promise.resolve();
	const active = enabling?.get(sg);
	if (active) return active;
	const oldTexture = sg._depthTexture;
	const mapSize = sg._config._mapSize;
	sg._depthTexture = engine._device.createTexture({
		size: {
			width: mapSize,
			height: mapSize,
			depthOrArrayLayers: sg._csmCascadeCount
		},
		format: "depth32float",
		usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
	});
	sg._csmCache = {
		_refitAngle: options.refitAngle,
		_refitMaxIntervalMs: options.refitMaxIntervalMs ?? 0,
		_staticCascadesPerFrame: staticCascadesPerFrame,
		_cascadeCoveragePadding: cascadeCoveragePadding
	};
	oldTexture.destroy();
	const promise = import("./csm-shadow-cache.js").then((module) => {
		sg._csmCache._loaded = true;
		const config = sg._config;
		const ensure = (eng, scene, casterMeshes) => {
			const state = module.ensureCsmShadowCacheState(eng, scene, sg, config, casterMeshes, sg._shadowTaskState ?? null);
			sg._shadowTaskState = state;
			return state;
		};
		const render = (eng, state) => module.renderCsmShadowMapCached(eng, sg, state, config);
		if (sg._replaceShadowTaskHooks) sg._replaceShadowTaskHooks(ensure, render);
		else {
			sg._ensureShadowTaskState = ensure;
			sg._renderShadowMap = render;
		}
	});
	(enabling ??= /* @__PURE__ */ new WeakMap()).set(sg, promise);
	promise.then(() => enabling?.delete(sg), () => enabling?.delete(sg));
	return promise;
}
export { enableCsmStaticCache };

//# sourceMappingURL=enable-csm-static-cache.js.map