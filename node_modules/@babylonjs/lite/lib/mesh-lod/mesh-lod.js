import { initSceneNodeTransform } from "../scene/scene-node.js";
import { createMeshLoDError, isMeshLoDError } from "./mesh-lod-errors.js";
// src/mesh-lod/mesh-lod.ts
var MIB = 1048576;
var DEFAULT_SCREEN_SPACE_ERROR = 2;
var DEFAULT_LOD_HYSTERESIS = .15;
var DEFAULT_RESIDENCY_HOLD_FRAMES = 120;
var DEFAULT_OBSOLETE_REQUEST_GRACE_FRAMES = 2;
var DEFAULT_CACHE_BUDGET_BYTES = 128 * MIB;
var DEFAULT_CACHE_CAPACITY_BYTES = 128 * MIB;
var DEFAULT_CPU_PAGE_CACHE_BYTES = 64 * MIB;
var DEFAULT_MAX_CONCURRENT_REQUESTS = 4;
var DEFAULT_RETRY_COUNT = 2;
var DEFAULT_SELECTION_MODE = "gpu";
function invalidOption(name, requirement, actual) {
	return createMeshLoDError("MLOD_INVALID_OPTION", `${name} must be ${requirement}`, {
		expected: requirement,
		actual
	});
}
function resolveFinitePositive(value, fallback, name) {
	if (value === void 0) return fallback;
	if (!Number.isFinite(value) || value <= 0) throw invalidOption(name, "a finite number > 0", value);
	return value;
}
function resolveNonNegativeInteger(value, fallback, name) {
	if (value === void 0) return fallback;
	if (!Number.isInteger(value) || value < 0) throw invalidOption(name, "a non-negative integer", value);
	return value;
}
function resolveSelectionMode(mode) {
	const value = mode ?? DEFAULT_SELECTION_MODE;
	if (value !== "cpu" && value !== "gpu") throw invalidOption("selectionMode", "\"cpu\" or \"gpu\"", String(value));
	return value;
}
/** @internal Validate load options and apply defaults. Exposed for unit tests;
*  the `@internal` tag strips it from the trimmed public declarations. Runs fully
*  before any network work, so invalid options reject without loading the runtime. */
function _resolveMeshLoDLoadOptions(options) {
	const screenSpaceError = resolveFinitePositive(options?.screenSpaceError, DEFAULT_SCREEN_SPACE_ERROR, "screenSpaceError");
	let lodHysteresis = DEFAULT_LOD_HYSTERESIS;
	if (options?.lodHysteresis !== void 0) {
		if (!Number.isFinite(options.lodHysteresis) || options.lodHysteresis < 0 || options.lodHysteresis >= 1) throw invalidOption("lodHysteresis", "a fraction in [0, 1)", options.lodHysteresis);
		lodHysteresis = options.lodHysteresis;
	}
	const residencyHoldFrames = resolveNonNegativeInteger(options?.residencyHoldFrames, DEFAULT_RESIDENCY_HOLD_FRAMES, "residencyHoldFrames");
	const obsoleteRequestGraceFrames = resolveNonNegativeInteger(options?.obsoleteRequestGraceFrames, DEFAULT_OBSOLETE_REQUEST_GRACE_FRAMES, "obsoleteRequestGraceFrames");
	const cacheCapacityBytes = resolveFinitePositive(options?.cacheCapacityBytes, DEFAULT_CACHE_CAPACITY_BYTES, "cacheCapacityBytes");
	const cacheBudgetBytes = resolveFinitePositive(options?.cacheBudgetBytes, Math.min(DEFAULT_CACHE_BUDGET_BYTES, cacheCapacityBytes), "cacheBudgetBytes");
	if (cacheBudgetBytes > cacheCapacityBytes) throw invalidOption("cacheBudgetBytes", "<= cacheCapacityBytes", cacheBudgetBytes);
	const cpuPageCacheBytes = resolveFinitePositive(options?.cpuPageCacheBytes, DEFAULT_CPU_PAGE_CACHE_BYTES, "cpuPageCacheBytes");
	let maxConcurrentRequests = DEFAULT_MAX_CONCURRENT_REQUESTS;
	if (options?.maxConcurrentRequests !== void 0) {
		if (!Number.isInteger(options.maxConcurrentRequests) || options.maxConcurrentRequests < 1) throw invalidOption("maxConcurrentRequests", "an integer >= 1", options.maxConcurrentRequests);
		maxConcurrentRequests = options.maxConcurrentRequests;
	}
	const retryCount = resolveNonNegativeInteger(options?.retryCount, DEFAULT_RETRY_COUNT, "retryCount");
	let retryDelaysMs = [250, 1e3];
	if (options?.retryDelaysMs !== void 0) {
		if (!Array.isArray(options.retryDelaysMs) || options.retryDelaysMs.some((d) => !Number.isFinite(d) || d < 0)) throw invalidOption("retryDelaysMs", "an array of non-negative finite numbers", String(options.retryDelaysMs));
		retryDelaysMs = options.retryDelaysMs.slice();
	}
	return {
		screenSpaceError,
		lodHysteresis,
		residencyHoldFrames,
		obsoleteRequestGraceFrames,
		cacheBudgetBytes,
		cacheCapacityBytes,
		cpuPageCacheBytes,
		maxConcurrentRequests,
		retryCount,
		retryDelaysMs
	};
}
/** Cached runtime module, populated on the first {@link loadMeshLoD}. Nullable
*  lazy cache only — no module-level collection or eager import. */
var _runtimeModule = null;
function requireRuntime() {
	const runtime = _runtimeModule;
	if (!runtime) throw createMeshLoDError("MLOD_DISPOSED", "MeshLoD runtime is not loaded; call loadMeshLoD before registering instances");
	return runtime;
}
/** Load, validate, and prepare a MeshLoD asset. Resolves only after the header,
*  directory, required metadata, hierarchy validation, and pinned coarse pages
*  are validated, decoded, and uploaded; fine pages stream afterwards. Invalid
*  options reject with `MLOD_INVALID_OPTION` before any network work. */
async function loadMeshLoD(engine, source, options) {
	const settings = _resolveMeshLoDLoadOptions(options);
	const selectionMode = resolveSelectionMode(options?.selectionMode);
	return (_runtimeModule ??= await import("./mesh-lod-runtime.js"))._loadMeshLoD(engine, source, settings, selectionMode, options?.request, options?.signal);
}
/** Create a placed instance of an asset using a supported opaque PBR material.
*  Unsupported material state throws `MLOD_UNSUPPORTED_MATERIAL`. */
function createMeshLoDInstance(asset, material, options) {
	const screenSpaceError = options?.screenSpaceError === void 0 ? void 0 : resolveFinitePositive(options.screenSpaceError, DEFAULT_SCREEN_SPACE_ERROR, "screenSpaceError");
	if (material.alphaBlend === true) throw createMeshLoDError("MLOD_UNSUPPORTED_MATERIAL", "MeshLoD requires an opaque PBR material; alpha blending is not supported", {
		expected: "opaque",
		actual: "alphaBlend"
	});
	const instance = initSceneNodeTransform({
		name: options?.name ?? "meshLoD",
		children: [],
		asset,
		_asset: asset,
		material,
		_material: material,
		visible: options?.visible ?? true,
		screenSpaceError,
		_instanceId: asset._runtime.nextInstanceId,
		_cloneNode: () => {
			const clone = createMeshLoDInstance(instance._asset, instance._material, {
				name: instance.name + "_clone",
				visible: instance.visible,
				screenSpaceError: instance.screenSpaceError
			});
			clone.position.copyFrom(instance.position);
			clone.rotationQuaternion.copyFrom(instance.rotationQuaternion);
			clone.scaling.copyFrom(instance.scaling);
			clone.metadata = instance.metadata;
			if (instance._localMatrix) {
				clone._localMatrix = instance._localMatrix.slice();
				clone._localMatrixLocked = instance._localMatrixLocked;
			}
			return clone;
		}
	});
	asset._runtime.nextInstanceId += 1;
	return instance;
}
/** Register an instance into a scene. Idempotent for the same scene/instance;
*  does not write a scene reference into the instance. The scene must use the
*  asset's loading engine; a different engine throws `MLOD_INVALID_OPTION`. */
function addMeshLoDToScene(scene, instance) {
	requireRuntime()._addMeshLoDToScene(scene, instance);
}
/** Remove an instance from a scene. Idempotent; the instance stops being
*  selected or submitted immediately. */
function removeMeshLoDFromScene(scene, instance) {
	requireRuntime()._removeMeshLoDFromScene(scene, instance);
}
/** Set the target screen-space error (pixels) for an asset. */
function setMeshLoDScreenSpaceError(asset, pixels) {
	if (!Number.isFinite(pixels) || pixels <= 0) throw invalidOption("screenSpaceError", "a finite number > 0", pixels);
	asset._runtime.settings.screenSpaceError = pixels;
}
/** Set the effective GPU residency budget (bytes). Must not exceed the immutable
*  arena capacity chosen at load. Takes effect on the next streaming step, which trims
*  resident fine pages down to the new budget and gates further uploads. */
function setMeshLoDCacheBudget(asset, bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) throw invalidOption("cacheBudgetBytes", "a finite number > 0", bytes);
	const arena = asset._runtime.gpu.arena;
	if (bytes > arena.capacityBytes) throw invalidOption("cacheBudgetBytes", "<= cacheCapacityBytes", bytes);
	const pinnedBytes = arena.pinnedCount * (arena.capacityBytes / arena.blockCount);
	if (bytes < pinnedBytes) throw createMeshLoDError("MLOD_BUDGET_TOO_SMALL", "cacheBudgetBytes cannot hold the pinned coarse pages", {
		expected: pinnedBytes,
		actual: bytes
	});
	asset._runtime.settings.cacheBudgetBytes = bytes;
	asset.diagnostics.gpuCacheBudgetBytes = bytes;
}
/** Pause or resume fine-page streaming. Coarse rendering, resident geometry, and the
*  coarse fallback are unaffected; pausing only suppresses new fine requests and
*  retries. Resuming pumps queued work on the next streaming step. */
function setMeshLoDStreamingPaused(asset, paused) {
	asset._runtime.streamingPaused = paused;
	asset.diagnostics.streamingPaused = paused;
}
/** Select a diagnostic debug view (or `"none"`). */
function setMeshLoDDebugView(asset, view) {
	asset._runtime.debugView = view;
}
/** Choose CPU (reference/diagnostic) or GPU (production) selection. */
function setMeshLoDSelectionMode(asset, mode) {
	const resolved = resolveSelectionMode(mode);
	if (asset._runtime.selectionMode !== resolved) {
		asset._runtime.selectionMode = resolved;
		asset._runtime._selectionEpoch++;
		asset._runtime._frameSnapshots.clear();
	}
}
/** Return the asset's live, read-only diagnostics object. */
function getMeshLoDDiagnostics(asset) {
	return asset.diagnostics;
}
/** Dispose an asset: abort outstanding work, invalidate completions, mark scene batches
*  non-drawable, retire the GPU arena/selection buffers after frame safety, release
*  retained CPU bytes, and mark it disposed. Idempotent. Does not dispose an asset still
*  used by another scene — that is scene disposal's concern. */
function disposeMeshLoDAsset(asset) {
	const runtime = asset._runtime;
	if (runtime.disposed) return;
	runtime.disposed = true;
	runtime.generation += 1;
	runtime.abortController.abort();
	const mod = _runtimeModule;
	mod?._disposeMeshLoDScheduler(runtime);
	mod?._disposeMeshLoDResources(runtime);
	asset.state = "disposed";
}
export { _resolveMeshLoDLoadOptions, addMeshLoDToScene, createMeshLoDInstance, disposeMeshLoDAsset, getMeshLoDDiagnostics, isMeshLoDError, loadMeshLoD, removeMeshLoDFromScene, setMeshLoDCacheBudget, setMeshLoDDebugView, setMeshLoDScreenSpaceError, setMeshLoDSelectionMode, setMeshLoDStreamingPaused };

//# sourceMappingURL=mesh-lod.js.map