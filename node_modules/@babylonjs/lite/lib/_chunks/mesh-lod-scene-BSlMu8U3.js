import { getCameraPosition, getEffectiveAspectRatio, getProjectionMatrix } from "../camera/camera.js";
import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
import { addDeferredSceneRenderables } from "../scene/scene-core.js";
import { createMeshLoDError, isMeshLoDError } from "../mesh-lod/mesh-lod-errors.js";
import { validateMeshLoDMaterial } from "../material/pbr/pbr-mesh-lod-material.js";
import { parseMeshLoDContainer, readBootstrapExtent, toMeshLoDMetadata } from "../mesh-lod/mesh-lod-format.js";
import { BOOTSTRAP_FIRST_END, concatBytes, createMeshLoDRangeSource, throwIfAborted } from "../mesh-lod/mesh-lod-range-source.js";
import { allocateArenaRun, arenaUsedBytes, clearMeshLoDCpuPageCache, cpuCacheUsedBytes, createMeshLoDArena, createMeshLoDCpuPageCache, evictMeshLoDPage, floorToBlocks, getMeshLoDCpuPage, pinnedAllocationBytes, putMeshLoDCpuPage, reserveMeshLoDArenaRun, retireMeshLoDToBudget, setMeshLoDCpuCacheBudget } from "../mesh-lod/mesh-lod-cache.js";
import { decodeMeshLoDPage, getMeshLoDPageDecoder } from "../mesh-lod/mesh-lod-page-decoder.js";
import { createMeshLoDRequestScheduler, disposeMeshLoDRequestScheduler, schedulerQueuedCount, submitMeshLoDDemand } from "../mesh-lod/mesh-lod-scheduler.js";
import { addMeshLoDPageBenefit } from "../mesh-lod/mesh-lod-selection-math.js";
import { selectMeshLoDCpu } from "../mesh-lod/mesh-lod-selection-cpu.js";
// src/mesh-lod/mesh-lod-runtime.ts
function createDiagnostics(parsed, settings, selectionMode, downloadedBytes) {
	return {
		frameIndex: 0,
		sourceTriangleCount: parsed.header.sourceTriangleCount,
		renderedTriangleCount: 0,
		selectedMeshletCount: 0,
		visibleGroupCount: 0,
		fallbackGroupCount: 0,
		maximumSelectedErrorPixels: 0,
		maximumUnmetErrorPixels: 0,
		requestedPageCount: 0,
		queuedPageCount: 0,
		inFlightPageCount: 0,
		residentPageCount: 0,
		pinnedPageCount: parsed.header.pinnedPageCount,
		terminalFailedPageCount: 0,
		downloadedBytes,
		gpuCacheUsedBytes: 0,
		gpuCacheBudgetBytes: settings.cacheBudgetBytes,
		gpuCacheCapacityBytes: settings.cacheCapacityBytes,
		cpuPageCacheUsedBytes: 0,
		maxConcurrentRequests: settings.maxConcurrentRequests,
		streamingPaused: false,
		selectionMode
	};
}
function reconcileArenaSettings(settings, capacityBytes) {
	settings.cacheCapacityBytes = capacityBytes;
	settings.cacheBudgetBytes = Math.min(settings.cacheBudgetBytes, capacityBytes);
}
/** Decode, upload, and mark GPU-resident every pinned coarse page, and allocate the
*  immutable geometry arena. Runs after metadata validation and before the asset is
*  registerable. Fine pages are left `unrequested`. Throws before any GPU allocation
*  when the configured budget/capacity cannot hold the pinned pages
*  (`MLOD_BUDGET_TOO_SMALL`), and surfaces pinned decode/upload failures as terminal
*  load failures. */
async function prepareCoarseResidency(engine, parsed, coarseBytes, settings, signal) {
	const pinnedBytes = pinnedAllocationBytes(parsed.pageRecords);
	if (floorToBlocks(settings.cacheCapacityBytes) < pinnedBytes) throw createMeshLoDError("MLOD_BUDGET_TOO_SMALL", "cacheCapacityBytes cannot hold the pinned coarse pages", {
		expected: pinnedBytes,
		actual: settings.cacheCapacityBytes
	});
	if (settings.cacheBudgetBytes < pinnedBytes) throw createMeshLoDError("MLOD_BUDGET_TOO_SMALL", "cacheBudgetBytes cannot hold the pinned coarse pages", {
		expected: pinnedBytes,
		actual: settings.cacheBudgetBytes
	});
	const decoder = await getMeshLoDPageDecoder();
	throwIfAborted(signal);
	const pages = parsed.pageRecords.map((record, id) => ({
		id,
		state: "unrequested",
		arenaOffset: -1,
		arenaBytes: 0,
		vertexByteOffset: record.vertexByteOffset,
		indices: null,
		lastUsedFrame: 0,
		priority: 0,
		frameRefCount: 0
	}));
	const arena = createMeshLoDArena(engine, settings.cacheCapacityBytes, pinnedBytes);
	let residentPageCount = 0;
	try {
		for (let id = 0; id < parsed.pageRecords.length; id++) {
			throwIfAborted(signal);
			const record = parsed.pageRecords[id];
			const page = pages[id];
			if (!record.pinned) continue;
			const stored = coarseBytes.subarray(record.offset, record.offset + record.storedBytes);
			let decoded;
			try {
				decoded = decodeMeshLoDPage(stored, record, decoder);
			} catch (cause) {
				const error = cause;
				page.state = "terminal-failed";
				page.terminalError = error;
				throw error;
			}
			const arenaOffset = allocateArenaRun(arena, record.decodedBytes, true);
			if (arenaOffset === null) throw createMeshLoDError("MLOD_BUDGET_TOO_SMALL", "pinned pages do not fit the geometry arena", {
				pageId: id,
				expected: pinnedBytes
			});
			engine._device.queue.writeBuffer(arena.buffer, arenaOffset, decoded.decoded.buffer, decoded.decoded.byteOffset, decoded.decoded.byteLength);
			page.arenaOffset = arenaOffset;
			page.arenaBytes = record.decodedBytes;
			page.indices = new Uint16Array(decoded.decoded.buffer, decoded.decoded.byteOffset + record.indexByteOffset, record.localIndexCount).slice();
			page.state = "gpu-resident";
			residentPageCount++;
		}
		throwIfAborted(signal);
		return {
			arena,
			pages,
			residentPageCount
		};
	} catch (cause) {
		arena.buffer.destroy();
		throw cause;
	}
}
/** Load and validate a MeshLoD asset from a resolved settings object.
*
*  Runs the coarse-first bootstrap: for a complete-file source it validates the
*  whole container; for a URL it reads the header (bytes `0-65535`), then reads at
*  most one continuation through `bootstrapBytes`, and validates the metadata plus
*  pinned pages while deferring fine pages to streaming. Pinned pages are then
*  decoded and uploaded into the immutable geometry arena; the promise resolves only
*  once the complete coarse geometry is GPU-resident. */
async function _loadMeshLoD(engine, source, settings, selectionMode, request, signal) {
	throwIfAborted(signal);
	const src = await createMeshLoDRangeSource(source, request);
	let parsed;
	let coarseBytes;
	if (src.completeBytes) {
		coarseBytes = src.completeBytes;
		parsed = parseMeshLoDContainer(coarseBytes);
	} else {
		const head = await src.read(0, BOOTSTRAP_FIRST_END, signal);
		if (src.completeBytes) {
			coarseBytes = src.completeBytes;
			parsed = parseMeshLoDContainer(coarseBytes);
		} else {
			const extent = readBootstrapExtent(head);
			if (src.totalBytes !== null && src.totalBytes !== extent.totalFileBytes) throw createMeshLoDError("MLOD_INVALID_LAYOUT", "transport total disagrees with the header", {
				expected: extent.totalFileBytes,
				actual: src.totalBytes
			});
			coarseBytes = head.length >= extent.bootstrapBytes ? head.subarray(0, extent.bootstrapBytes) : concatBytes(head, await src.read(head.length, extent.bootstrapBytes - 1, signal));
			parsed = parseMeshLoDContainer(coarseBytes);
		}
	}
	if (src.totalBytes !== null && src.totalBytes !== parsed.header.totalFileBytes) throw createMeshLoDError("MLOD_TRUNCATED", "transport total disagrees with the declared file size", {
		expected: parsed.header.totalFileBytes,
		actual: src.totalBytes
	});
	const diagnostics = createDiagnostics(parsed, settings, selectionMode, src.downloadedBytes);
	const gpu = await prepareCoarseResidency(engine, parsed, coarseBytes, settings, signal);
	try {
		throwIfAborted(signal);
		reconcileArenaSettings(settings, gpu.arena.capacityBytes);
		diagnostics.residentPageCount = gpu.residentPageCount;
		diagnostics.gpuCacheUsedBytes = arenaUsedBytes(gpu.arena);
		diagnostics.gpuCacheBudgetBytes = settings.cacheBudgetBytes;
		diagnostics.gpuCacheCapacityBytes = gpu.arena.capacityBytes;
		diagnostics.downloadedBytes = src.downloadedBytes;
		const cpuPageCache = createMeshLoDCpuPageCache(settings.cpuPageCacheBytes);
		for (let id = 0; id < parsed.pageRecords.length; id++) {
			const record = parsed.pageRecords[id];
			if (record.pinned) putMeshLoDCpuPage(cpuPageCache, id, coarseBytes.subarray(record.offset, record.offset + record.storedBytes).slice(), true, 0);
		}
		diagnostics.cpuPageCacheUsedBytes = cpuCacheUsedBytes(cpuPageCache);
		const decoderModule = await getMeshLoDPageDecoder();
		throwIfAborted(signal);
		const runtime = {
			engine,
			source: src,
			coarseBytes,
			header: parsed.header,
			sections: parsed.sections,
			groups: parsed.groups,
			clusters: parsed.clusters,
			hierarchyNodes: parsed.hierarchyNodes,
			pageRecords: parsed.pageRecords,
			groupPageRefs: parsed.groupPageRefs,
			gpu,
			gpuDevice: engine._device,
			gpuSelection: null,
			scheduler: null,
			_schedulerTimers: null,
			decoderModule,
			cpuPageCache,
			settings,
			diagnostics,
			abortController: new AbortController(),
			generation: 0,
			frameIndex: 0,
			_selectionEpoch: 0,
			_frameSnapshots: /* @__PURE__ */ new Map(),
			streamingPaused: false,
			debugView: "none",
			selectionMode,
			nextInstanceId: 0,
			disposed: false
		};
		return {
			metadata: toMeshLoDMetadata(parsed),
			diagnostics,
			state: "ready",
			_runtime: runtime
		};
	} catch (cause) {
		gpu.arena.buffer.destroy();
		throw cause;
	}
}
/** Register an instance into its scene-owned MeshLoD batch (delegates to the scene
*  registry module). */
function _addMeshLoDToScene(scene, instance) {
	addMeshLoDInstanceToScene(scene, instance);
}
/** @internal Normalize a raw GPU/model selected `(cluster, instance)` list to
*  per-instance ascending unique cluster IDs — the canonical form CPU/GPU equivalence
*  fixtures and real-device readbacks compare against the CPU oracle's
*  `selectedClusterIds`. A testing-only hook kept off the trimmed public declaration
*  surface (never re-exported from `index.ts`). Pass `instanceId` to filter one
*  instance out of a multi-instance batch readback. */
function _normalizeMeshLoDSelectedClusterIds(pairs, instanceId) {
	const ids = /* @__PURE__ */ new Set();
	for (const pair of pairs) if (instanceId === void 0 || pair.instanceId === instanceId) ids.add(pair.clusterId);
	return Uint32Array.from([...ids].sort((a, b) => a - b));
}
/** Remove an instance from its scene-owned MeshLoD batch (delegates to the scene
*  registry module). */
function _removeMeshLoDFromScene(scene, instance) {
	removeMeshLoDInstanceFromScene(scene, instance);
}
/** Inclusive end byte of a page's stored range within the container. */
function pageByteEnd(record) {
	return record.offset + record.storedBytes - 1;
}
/** Fetch one fine page's encoded bytes. A retained encoded copy (CPU cache) short-
*  circuits the network for an evicted-then-re-demanded page (§11.5); otherwise the
*  range source reads exactly its stored bytes. */
function fetchStreamedPage(runtime, pageId, signal) {
	const cached = getMeshLoDCpuPage(runtime.cpuPageCache, pageId, runtime.frameIndex);
	if (cached) return Promise.resolve(cached);
	const record = runtime.pageRecords[pageId];
	return runtime.source.read(record.offset, pageByteEnd(record), signal);
}
/** Lazily create the fine-page scheduler bound to this asset's runtime. Decode, cache,
*  reservation, upload, and residency commit stay runtime-owned via the callbacks. */
function ensureMeshLoDScheduler(runtime) {
	if (runtime.scheduler) return runtime.scheduler;
	const scheduler = createMeshLoDRequestScheduler({
		maxConcurrentRequests: runtime.settings.maxConcurrentRequests,
		retryCount: runtime.settings.retryCount,
		retryDelaysMs: runtime.settings.retryDelaysMs,
		obsoleteRequestGraceFrames: runtime.settings.obsoleteRequestGraceFrames,
		callbacks: {
			fetchPage: (pageId, signal) => fetchStreamedPage(runtime, pageId, signal),
			onPageReceived: (pageId, bytes) => commitStreamedPage(runtime, pageId, bytes),
			onPageFailed: (pageId, error) => failStreamedPage(runtime, pageId, error),
			currentGeneration: () => runtime.generation,
			isPaused: () => runtime.streamingPaused
		},
		timers: runtime._schedulerTimers ?? void 0
	});
	runtime.scheduler = scheduler;
	return scheduler;
}
/** Commit a fresh, non-stale fetched fine page: validate + decode, retain its encoded
*  bytes, reserve a decoded arena run (evicting eligible victims), upload, and mark it
*  GPU-resident. A decode/integrity failure is page-local (terminal-failed). If no run
*  fits without evicting protected pages the page stays unrequested for a later frame,
*  its encoded bytes retained. */
function commitStreamedPage(runtime, pageId, bytes) {
	if (runtime.disposed) return;
	const record = runtime.pageRecords[pageId];
	const page = runtime.gpu.pages[pageId];
	putMeshLoDCpuPage(runtime.cpuPageCache, pageId, bytes.slice(), record.pinned, runtime.frameIndex);
	page.state = "decoding";
	let decoded;
	try {
		decoded = decodeMeshLoDPage(bytes, record, runtime.decoderModule);
	} catch (cause) {
		failStreamedPage(runtime, pageId, cause);
		return;
	}
	page.state = "cpu-resident";
	const policy = {
		budgetBytes: floorToBlocks(runtime.settings.cacheBudgetBytes),
		currentFrame: runtime.frameIndex,
		residencyHoldFrames: runtime.settings.residencyHoldFrames
	};
	const evicted = [];
	const offset = reserveMeshLoDArenaRun(runtime.gpu.arena, runtime.gpu.pages, runtime.pageRecords, record.decodedBytes, policy, evicted);
	if (offset === null) retireMeshLoDToBudget(runtime.gpu.arena, runtime.gpu.pages, runtime.pageRecords, policy, evicted, record.decodedBytes);
	applyStreamedEvictions(runtime, evicted);
	if (offset === null) {
		page.state = "unrequested";
		refreshMeshLoDStreamingDiagnostics(runtime);
		return;
	}
	page.state = "uploading";
	const arena = runtime.gpu.arena;
	runtime.engine._device.queue.writeBuffer(arena.buffer, offset, decoded.decoded.buffer, decoded.decoded.byteOffset, decoded.decoded.byteLength);
	page.arenaOffset = offset;
	page.arenaBytes = record.decodedBytes;
	page.indices = new Uint16Array(decoded.decoded.buffer, decoded.decoded.byteOffset + record.indexByteOffset, record.localIndexCount).slice();
	page.lastUsedFrame = runtime.frameIndex;
	page.state = "gpu-resident";
	runtime.gpu.residentPageCount++;
	refreshMeshLoDStreamingDiagnostics(runtime);
}
/** Record a page-local terminal fine failure (never fails the coarse asset). A page
*  that already reached residency ignores a late failure. */
function failStreamedPage(runtime, pageId, error) {
	const page = runtime.gpu.pages[pageId];
	if (runtime.disposed || page.state === "gpu-resident") return;
	page.state = "terminal-failed";
	page.terminalError = error;
	refreshMeshLoDStreamingDiagnostics(runtime);
}
/** Account evicted pages: each was reset to `unrequested` by the cache; drop the
*  resident count. Encoded bytes stay retained in the CPU cache for re-demand. */
function applyStreamedEvictions(runtime, evicted) {
	for (let i = 0; i < evicted.length; i++) if (runtime.gpu.residentPageCount > 0) runtime.gpu.residentPageCount--;
}
function countTerminalFailedPages(runtime) {
	let count = 0;
	for (const page of runtime.gpu.pages) if (page.state === "terminal-failed") count++;
	return count;
}
/** Refresh the live diagnostics counters that streaming and residency own. */
function refreshMeshLoDStreamingDiagnostics(runtime) {
	const d = runtime.diagnostics;
	const scheduler = runtime.scheduler;
	d.requestedPageCount = scheduler ? scheduler.requests.size : 0;
	d.queuedPageCount = scheduler ? schedulerQueuedCount(scheduler) : 0;
	d.inFlightPageCount = scheduler ? scheduler.inFlightCount : 0;
	d.residentPageCount = runtime.gpu.residentPageCount;
	d.terminalFailedPageCount = countTerminalFailedPages(runtime);
	d.downloadedBytes = runtime.source.downloadedBytes;
	d.gpuCacheUsedBytes = arenaUsedBytes(runtime.gpu.arena);
	d.gpuCacheBudgetBytes = runtime.settings.cacheBudgetBytes;
	d.cpuPageCacheUsedBytes = cpuCacheUsedBytes(runtime.cpuPageCache);
	d.maxConcurrentRequests = scheduler ? scheduler.maxConcurrentRequests : runtime.settings.maxConcurrentRequests;
	d.streamingPaused = runtime.streamingPaused;
	d.selectionMode = runtime.selectionMode;
}
/** @internal Drive one frame of fine-page streaming for an asset. Advances the frame
*  counter, applies pending control changes (concurrency, CPU-cache budget), holds a
*  frame reference on every page a rendered cluster used (released after the frame is
*  submitted, per §14.1), feeds generation-stamped demand to the scheduler, trims
*  residency to the effective GPU budget, and refreshes diagnostics. Called by the
*  scene each frame with the aggregated per-instance page demand and referenced pages. */
function stepMeshLoDStreaming(runtime, demand, referencedPages, selectionStats, advanceFrame = true) {
	if (runtime.disposed) return;
	const frame = advanceFrame ? ++runtime.frameIndex : runtime.frameIndex;
	setMeshLoDCpuCacheBudget(runtime.cpuPageCache, runtime.settings.cpuPageCacheBytes);
	if (runtime.scheduler) runtime.scheduler.maxConcurrentRequests = runtime.settings.maxConcurrentRequests;
	if (referencedPages.length > 0) holdMeshLoDPages(runtime, referencedPages, frame, true);
	for (const item of demand) {
		const page = runtime.gpu.pages[item.pageId];
		if (page) page.priority = item.priority;
	}
	if (demand.length > 0 || runtime.scheduler) submitMeshLoDDemand(ensureMeshLoDScheduler(runtime), demand, frame);
	const policy = {
		budgetBytes: floorToBlocks(runtime.settings.cacheBudgetBytes),
		currentFrame: frame,
		residencyHoldFrames: runtime.settings.residencyHoldFrames
	};
	const evicted = [];
	if (advanceFrame) {
		retireMeshLoDToBudget(runtime.gpu.arena, runtime.gpu.pages, runtime.pageRecords, policy, evicted);
		applyStreamedEvictions(runtime, evicted);
	}
	if (selectionStats) {
		const d = runtime.diagnostics;
		d.frameIndex = frame;
		d.visibleGroupCount = selectionStats.visibleGroupCount;
		d.fallbackGroupCount = selectionStats.fallbackGroupCount;
		d.maximumSelectedErrorPixels = selectionStats.maximumSelectedErrorPixels;
		d.maximumUnmetErrorPixels = selectionStats.maximumUnmetErrorPixels;
	} else runtime.diagnostics.frameIndex = frame;
	refreshMeshLoDStreamingDiagnostics(runtime);
}
/** Keep allocations used by this submission alive until its fence drains. GPU work
*  initially protects every advertised resident page, but only feedback from actual
*  selected clusters (or synchronous CPU selection) updates LRU age. */
function holdMeshLoDPages(runtime, ids, frame, selected) {
	const held = [];
	const generation = runtime.generation;
	const coordinator = _meshLoDFrameCoordinators?.get(runtime.engine);
	for (const id of new Set(ids)) {
		const page = runtime.gpu.pages[id];
		if (page?.state !== "gpu-resident") continue;
		page.frameRefCount++;
		if (selected) {
			if (frame === runtime.frameIndex + 1 && coordinator?.pending.has(runtime)) {
				let prior = coordinator.priorUsage.get(runtime);
				if (!prior) {
					prior = /* @__PURE__ */ new Map();
					coordinator.priorUsage.set(runtime, prior);
				}
				if (!prior.has(page)) prior.set(page, page.lastUsedFrame);
			}
			page.lastUsedFrame = Math.max(page.lastUsedFrame, frame);
		}
		held.push(page);
	}
	if (held.length === 0) return;
	retireGpuResources(runtime.engine, () => {
		for (const page of held) {
			if (page.frameRefCount > 0) page.frameRefCount--;
			if (page.frameRefCount === 0 && page.state === "evicting" && !runtime.disposed && runtime.generation === generation && runtime.gpu.pages[page.id] === page) {
				const evicted = [];
				evictMeshLoDPage(runtime.gpu.arena, page, evicted);
				applyStreamedEvictions(runtime, evicted);
				refreshMeshLoDStreamingDiagnostics(runtime);
			}
		}
	});
}
/** Collect one producer's demand until the enclosing engine frame submits. A missing
*  GPU readback retains its last snapshot, whereas an explicit empty result clears it. */
function queueMeshLoDFrame(runtime, producer, mode, demand, stats) {
	const frame = runtime.frameIndex + 1;
	if (runtime.disposed) return frame;
	const engine = runtime.engine;
	const coordinators = _meshLoDFrameCoordinators ??= /* @__PURE__ */ new WeakMap();
	let coordinator = coordinators.get(engine);
	if (!coordinator) {
		coordinator = {
			pending: /* @__PURE__ */ new Set(),
			tracked: /* @__PURE__ */ new Set(),
			priorUsage: /* @__PURE__ */ new Map(),
			priorSnapshots: /* @__PURE__ */ new Map()
		};
		coordinators.set(engine, coordinator);
		engine._finishOptionalFrame = (submitted) => submitted ? finishMeshLoDFrame(engine) : abortMeshLoDFrame(engine);
	}
	const existing = runtime._frameSnapshots.get(producer);
	let prior = coordinator.priorSnapshots.get(runtime);
	if (!prior) {
		prior = /* @__PURE__ */ new Map();
		coordinator.priorSnapshots.set(runtime, prior);
	}
	if (!prior.has(producer)) prior.set(producer, existing);
	const combined = demand && existing?.frame === frame && existing.mode === mode ? mergeMeshLoDDemand([existing.demand, demand]) : demand;
	runtime._frameSnapshots.set(producer, {
		frame,
		mode,
		demand: combined ? [...combined] : existing?.mode === mode ? existing.demand : [],
		stats: stats ?? (existing?.mode === mode ? existing.stats : void 0),
		lastReadbackFrame: mode === "gpu" && demand !== null ? frame : existing?.mode === mode ? existing.lastReadbackFrame : 0
	});
	coordinator.pending.add(runtime);
	coordinator.tracked.add(runtime);
	return frame;
}
var _meshLoDFrameCoordinators = null;
function mergeMeshLoDDemand(snapshots) {
	const priorityByPage = /* @__PURE__ */ new Map();
	for (const demand of snapshots) for (const { pageId, priority } of demand) {
		const old = priorityByPage.get(pageId);
		if (old === void 0 || priority > old) priorityByPage.set(pageId, priority);
	}
	return [...priorityByPage].map(([pageId, priority]) => ({
		pageId,
		priority
	})).sort((a, b) => b.priority - a.priority || a.pageId - b.pageId);
}
function mergedMeshLoDFrame(runtime, frame) {
	const demanded = [];
	const stats = {
		visibleGroupCount: 0,
		fallbackGroupCount: 0,
		maximumSelectedErrorPixels: 0,
		maximumUnmetErrorPixels: 0
	};
	for (const snapshot of runtime._frameSnapshots.values()) {
		if (snapshot.frame !== frame || snapshot.mode !== runtime.selectionMode) continue;
		demanded.push(snapshot.demand);
		if (snapshot.stats) {
			stats.visibleGroupCount = Math.max(stats.visibleGroupCount, snapshot.stats.visibleGroupCount);
			stats.fallbackGroupCount = Math.max(stats.fallbackGroupCount, snapshot.stats.fallbackGroupCount);
			stats.maximumSelectedErrorPixels = Math.max(stats.maximumSelectedErrorPixels, snapshot.stats.maximumSelectedErrorPixels);
			stats.maximumUnmetErrorPixels = Math.max(stats.maximumUnmetErrorPixels, snapshot.stats.maximumUnmetErrorPixels);
		}
	}
	return {
		demand: mergeMeshLoDDemand(demanded).filter(({ pageId }) => {
			const page = runtime.gpu.pages[pageId];
			return page && !runtime.pageRecords[pageId].pinned && (page.state === "unrequested" || page.state === "queued" || page.state === "fetching" || page.state === "retry-wait");
		}),
		stats
	};
}
/** Called once after each successful engine/XR submit, not per batch/readback. */
function finishMeshLoDFrame(engine) {
	const coordinator = _meshLoDFrameCoordinators?.get(engine);
	if (!coordinator) return;
	for (const runtime of coordinator.tracked) {
		if (runtime.disposed) {
			runtime._frameSnapshots.clear();
			coordinator.tracked.delete(runtime);
			continue;
		}
		const frame = runtime.frameIndex + 1;
		for (const [key, snapshot] of runtime._frameSnapshots) if (snapshot.frame !== frame || snapshot.mode !== runtime.selectionMode) runtime._frameSnapshots.delete(key);
		const merged = mergedMeshLoDFrame(runtime, frame);
		stepMeshLoDStreaming(runtime, merged.demand, [], merged.stats);
		if (!coordinator.pending.has(runtime) && !runtime.scheduler?.requests.size) coordinator.tracked.delete(runtime);
	}
	coordinator.pending.clear();
	coordinator.priorUsage.clear();
	coordinator.priorSnapshots.clear();
}
function abortMeshLoDFrame(engine) {
	const coordinator = _meshLoDFrameCoordinators?.get(engine);
	if (!coordinator) return;
	for (const runtime of coordinator.pending) {
		for (const [page, age] of coordinator.priorUsage.get(runtime) ?? []) page.lastUsedFrame = age;
		for (const [producer, previous] of coordinator.priorSnapshots.get(runtime) ?? []) if (previous) runtime._frameSnapshots.set(producer, previous);
		else runtime._frameSnapshots.delete(producer);
		if (!runtime.scheduler?.requests.size) coordinator.tracked.delete(runtime);
	}
	coordinator.pending.clear();
	coordinator.priorUsage.clear();
	coordinator.priorSnapshots.clear();
}
/** Accept a GPU observation without incrementing the frame clock. A completion from
*  an older frame may renew demand for a still-active producer, but never overwrites a
*  newer observation or updates LRU age using completion time. */
function publishMeshLoDGpuReadback(runtime, producer, sourceFrame, demand, stats, selectedPages) {
	const snapshot = runtime._frameSnapshots.get(producer);
	if (runtime.disposed || runtime.selectionMode !== "gpu" || !snapshot || snapshot.mode !== "gpu" || sourceFrame > snapshot.frame || sourceFrame < snapshot.lastReadbackFrame) return false;
	snapshot.demand = sourceFrame === snapshot.lastReadbackFrame ? mergeMeshLoDDemand([snapshot.demand, demand]) : [...demand];
	snapshot.lastReadbackFrame = sourceFrame;
	snapshot.stats = stats;
	for (const id of new Set(selectedPages)) {
		const page = runtime.gpu.pages[id];
		if (page?.state === "gpu-resident") page.lastUsedFrame = Math.max(page.lastUsedFrame, sourceFrame);
	}
	if (snapshot.frame === runtime.frameIndex) {
		const merged = mergedMeshLoDFrame(runtime, runtime.frameIndex);
		stepMeshLoDStreaming(runtime, merged.demand, [], merged.stats, false);
	}
	return true;
}
/** @internal Cancel every outstanding fine-page request and drop the scheduler. Called
*  from disposal and device recovery; late completions are already stale by generation. */
function _disposeMeshLoDScheduler(runtime) {
	if (runtime.scheduler) {
		disposeMeshLoDRequestScheduler(runtime.scheduler);
		runtime.scheduler = null;
	}
}
/** @internal Free an asset's GPU + CPU residency on disposal (§14.2). The geometry
*  arena and the shared per-asset selection buffers retire only after the next
*  submitted frame that could reference them drains (make-before-break / frame safety,
*  REQ-RENDER-4); the batch draw path stops immediately (disposed batches are
*  non-drawable), so retained CPU page bytes and decoded indices are released now.
*  Idempotent-safe: repeated disposal is guarded by the caller. */
function _disposeMeshLoDResources(runtime) {
	runtime.source.dispose();
	runtime.coarseBytes = /* @__PURE__ */ new Uint8Array(0);
	runtime._frameSnapshots.clear();
	const coordinator = _meshLoDFrameCoordinators?.get(runtime.engine);
	coordinator?.tracked.delete(runtime);
	coordinator?.priorUsage.delete(runtime);
	coordinator?.priorSnapshots.delete(runtime);
	const engine = runtime.engine;
	const arenaBuffer = runtime.gpu?.arena.buffer;
	const selection = runtime.gpuSelection;
	runtime.gpuSelection = null;
	retireGpuResources(engine, () => {
		arenaBuffer?.destroy?.();
		selection?.metaBuffer.destroy?.();
		selection?.pageStateBuffer.destroy?.();
	});
	if (runtime.gpu) {
		for (const page of runtime.gpu.pages) {
			page.indices = null;
			page.state = "disposed";
			page.arenaOffset = -1;
			page.arenaBytes = 0;
			page.frameRefCount = 0;
		}
		runtime.gpu.residentPageCount = 0;
	}
	clearMeshLoDCpuPageCache(runtime.cpuPageCache);
}
/** @internal Rebuild an asset's GPU residency on the recovered device (architecture §14.3).
*  Recreates the geometry arena, re-decodes and re-uploads the retained pinned coarse pages,
*  resets fine pages to `unrequested` (restored opportunistically by streaming), and drops
*  the shared selection buffers so they rebuild against the new device. Idempotent per
*  device (a shared asset recovers once). A pinned re-decode/upload failure is terminal —
*  it throws `MLOD_DEVICE_RECOVERY` and leaves no partial coarse residency, so recovery
*  cannot claim success. Old resources on a truly lost device need no queue retirement. */
function _recoverMeshLoDAsset(engine, runtime) {
	if (runtime.disposed || runtime.gpuDevice === engine._device) return;
	runtime.generation += 1;
	runtime._frameSnapshots.clear();
	_disposeMeshLoDScheduler(runtime);
	const pinnedBytes = pinnedAllocationBytes(runtime.pageRecords);
	const pages = runtime.pageRecords.map((record, id) => ({
		id,
		state: "unrequested",
		arenaOffset: -1,
		arenaBytes: 0,
		vertexByteOffset: record.vertexByteOffset,
		indices: null,
		lastUsedFrame: 0,
		priority: 0,
		frameRefCount: 0
	}));
	const arena = createMeshLoDArena(engine, runtime.settings.cacheCapacityBytes, pinnedBytes);
	let residentPageCount = 0;
	try {
		for (let id = 0; id < runtime.pageRecords.length; id++) {
			const record = runtime.pageRecords[id];
			if (!record.pinned) continue;
			const encoded = getMeshLoDCpuPage(runtime.cpuPageCache, id, runtime.frameIndex);
			if (!encoded) throw createMeshLoDError("MLOD_DEVICE_RECOVERY", "retained pinned coarse bytes are unavailable for device recovery", { pageId: id });
			let decoded;
			try {
				decoded = decodeMeshLoDPage(encoded, record, runtime.decoderModule);
			} catch (cause) {
				throw createMeshLoDError("MLOD_DEVICE_RECOVERY", "failed to re-decode a pinned coarse page during device recovery", {
					pageId: id,
					actual: cause?.message
				});
			}
			const offset = allocateArenaRun(arena, record.decodedBytes, true);
			if (offset === null) throw createMeshLoDError("MLOD_DEVICE_RECOVERY", "recovered geometry arena cannot hold the pinned coarse pages", { pageId: id });
			try {
				engine._device.queue.writeBuffer(arena.buffer, offset, decoded.decoded.buffer, decoded.decoded.byteOffset, decoded.decoded.byteLength);
			} catch (cause) {
				throw createMeshLoDError("MLOD_DEVICE_RECOVERY", "failed to upload a pinned coarse page during device recovery", {
					pageId: id,
					cause
				});
			}
			pages[id].arenaOffset = offset;
			pages[id].arenaBytes = record.decodedBytes;
			pages[id].indices = new Uint16Array(decoded.decoded.buffer, decoded.decoded.byteOffset + record.indexByteOffset, record.localIndexCount).slice();
			pages[id].state = "gpu-resident";
			residentPageCount++;
		}
	} catch (cause) {
		arena.buffer.destroy();
		throw cause;
	}
	runtime.gpu = {
		arena,
		pages,
		residentPageCount
	};
	reconcileArenaSettings(runtime.settings, arena.capacityBytes);
	runtime.gpuSelection = null;
	runtime.gpuDevice = engine._device;
	const d = runtime.diagnostics;
	d.gpuCacheCapacityBytes = arena.capacityBytes;
	refreshMeshLoDStreamingDiagnostics(runtime);
}
// src/mesh-lod/mesh-lod-scene.ts
function getOrCreateRegistry(scene) {
	let registry = scene._meshLoDRegistry;
	if (!registry) {
		registry = {
			byAsset: /* @__PURE__ */ new Map(),
			batches: [],
			builderRegistered: false
		};
		scene._meshLoDRegistry = registry;
		const owned = registry;
		scene._materialRebuild = (matches) => {
			const build = () => rebuildMeshLoDMaterials(scene, matches);
			const pending = owned.materialRebuild ? owned.materialRebuild.then(build, build) : build();
			owned.materialRebuild = pending;
			const clear = () => {
				if (owned.materialRebuild === pending) owned.materialRebuild = void 0;
			};
			pending.then(clear, clear);
			return pending;
		};
	}
	return registry;
}
function getOrCreateBatch(registry, asset, material) {
	let byMaterial = registry.byAsset.get(asset);
	if (!byMaterial) {
		byMaterial = /* @__PURE__ */ new Map();
		registry.byAsset.set(asset, byMaterial);
	}
	let batch = byMaterial.get(material);
	if (!batch) {
		batch = {
			asset,
			material,
			instances: []
		};
		byMaterial.set(material, batch);
		registry.batches.push(batch);
	}
	return batch;
}
/** @internal Cached PBR MeshLoD material module — dynamically imported on the first
*  scene build so this scene module never statically references the PBR MeshLoD
*  chunk (and non-MeshLoD scenes fetch none of it). Nullable lazy cache only. */
var _pbrMeshLoDModule = null;
async function getPbrMeshLoDModule() {
	if (!_pbrMeshLoDModule) _pbrMeshLoDModule = await import("../material/pbr/pbr-mesh-lod-renderable.js");
	return _pbrMeshLoDModule;
}
/** Build each material-owned indirect renderable and attach a device-recovery thunk. */
async function buildMeshLoDBatchRenderables(engine, scene, batches = scene._meshLoDRegistry?.batches ?? []) {
	const renderables = [];
	const pbr = await getPbrMeshLoDModule();
	if (scene._z) throw createMeshLoDError("MLOD_DISPOSED", "scene was disposed during the MeshLoD build");
	validateMeshLoDEngine(engine);
	for (const batch of batches) if (batch.instances.length && batch.asset.state !== "failed" && !batch.asset._runtime.disposed) validateMeshLoDMaterial(batch.material);
	const staged = [];
	try {
		for (const batch of batches) {
			if (batch.asset.state === "failed" || batch.asset._runtime.disposed) continue;
			const rebuild = async () => {
				const previous = batch._packet;
				batch._packet = void 0;
				batch.renderable = void 0;
				try {
					recoverMeshLoDAssets(engine, scene);
					const next = await pbr.buildMeshLoDBatchRenderable(engine, scene, batch);
					batch.renderable = next ?? void 0;
					if (next) next._rebuild = rebuild;
					return next;
				} finally {
					previous?.dispose?.();
				}
			};
			const candidate = {
				...batch,
				_packet: void 0,
				renderable: void 0
			};
			staged.push({
				batch,
				candidate
			});
			const renderable = await pbr.buildMeshLoDBatchRenderable(engine, scene, candidate);
			if (renderable) {
				renderable._rebuild = rebuild;
				candidate.renderable = renderable;
				renderables.push(renderable);
			}
		}
		if (scene._z) throw createMeshLoDError("MLOD_DISPOSED", "scene was disposed during the MeshLoD build");
	} catch (error) {
		for (const { candidate } of staged) candidate._packet?.dispose?.();
		throw error;
	}
	for (const { batch, candidate } of staged) {
		batch._packet = candidate._packet;
		batch.renderable = candidate.renderable;
	}
	return renderables;
}
async function rebuildMeshLoDMaterials(scene, matches) {
	if (!scene._built || scene._z) return;
	const batches = scene._meshLoDRegistry.batches.filter((batch) => batch.renderable && !batch.asset._runtime.disposed && matches(batch.material));
	if (!batches.length) return;
	const previous = batches.map((batch) => ({
		renderable: batch.renderable,
		packet: batch._packet
	}));
	const engine = scene.surface.engine;
	await buildMeshLoDBatchRenderables(engine, scene, batches);
	for (let i = 0; i < batches.length; i++) {
		const old = previous[i];
		const renderable = batches[i].renderable;
		const index = scene._renderables.indexOf(old.renderable);
		if (index >= 0) scene._renderables.splice(index, 1, ...renderable ? [renderable] : []);
		retireGpuResources(engine, () => old.packet?.dispose?.());
	}
	scene._renderableVersion++;
	scene._materialEpoch++;
}
/** Dispose every batch's material-owned GPU packet (scene teardown). Idempotent. */
function disposeMeshLoDBatchPackets(scene) {
	scene._materialRebuild = void 0;
	const registry = scene._meshLoDRegistry;
	if (!registry) return;
	for (const batch of registry.batches) {
		batch._packet?.dispose?.();
		batch._packet = void 0;
		batch.renderable = void 0;
	}
}
/** Recover assets on a replacement device once, failing the recovery if coarse data is lost. */
function recoverMeshLoDAssets(engine, scene) {
	const registry = scene._meshLoDRegistry;
	if (!registry) return;
	for (const asset of registry.byAsset.keys()) {
		if (asset._runtime.disposed || asset._runtime.gpuDevice === engine._device) continue;
		asset.state = "recovering";
		try {
			_recoverMeshLoDAsset(engine, asset._runtime);
			asset.state = "ready";
		} catch (error) {
			asset.state = "failed";
			asset.error = isMeshLoDError(error) ? error : createMeshLoDError("MLOD_DEVICE_RECOVERY", "failed to rebuild MeshLoD coarse residency", {
				cause: error,
				actual: error instanceof Error ? error.message : String(error)
			});
			throw asset.error;
		}
	}
}
function registerDeferredBuilder(scene) {
	addDeferredSceneRenderables(scene, async (engine, sc) => {
		try {
			return {
				renderables: await buildMeshLoDBatchRenderables(engine, sc),
				dispose: () => disposeMeshLoDBatchPackets(scene)
			};
		} catch (error) {
			if (!scene._z) registerDeferredBuilder(scene);
			throw error;
		}
	});
}
/** @internal Register an instance into its scene-owned batch. Idempotent for the
*  same scene/instance; validates the guaranteed opaque PBR subset immediately and
*  writes no scene reference into the instance. */
function addMeshLoDInstanceToScene(scene, instance) {
	if (instance._asset._runtime.engine !== scene.surface.engine) throw createMeshLoDError("MLOD_INVALID_OPTION", "MeshLoD instances must be registered with the asset's loading engine");
	validateMeshLoDEngine(scene.surface.engine);
	validateMeshLoDMaterial(instance._material);
	const existingBatch = scene._meshLoDRegistry?.byAsset.get(instance._asset)?.get(instance._material);
	if (scene._built && !existingBatch?.renderable) throw createMeshLoDError("MLOD_INVALID_OPTION", "Add MeshLoD asset/material batches before registering the scene; only instances of batches with a live renderable can be added afterward");
	const registry = getOrCreateRegistry(scene);
	const batch = getOrCreateBatch(registry, instance._asset, instance._material);
	if (!batch.instances.includes(instance)) batch.instances.push(instance);
	if (!registry.builderRegistered) {
		registry.builderRegistered = true;
		registerDeferredBuilder(scene);
	}
}
/** @internal Reject engine configurations outside the MeshLoD rendering contract. */
function validateMeshLoDEngine(engine) {
	if (engine.useFloatingOrigin) throw createMeshLoDError("MLOD_INVALID_OPTION", "MeshLoD v1 does not support floating-origin rendering", {
		expected: "useFloatingOrigin: false",
		actual: "useFloatingOrigin: true"
	});
}
/** @internal Remove an instance from its scene-owned batch. Idempotent; the
*  instance stops being selected and submitted immediately. */
function removeMeshLoDInstanceFromScene(scene, instance) {
	const batch = scene._meshLoDRegistry?.byAsset.get(instance._asset)?.get(instance._material);
	if (!batch) return;
	const index = batch.instances.indexOf(instance);
	if (index !== -1) {
		batch.instances.splice(index, 1);
		instance._selectionVersion = (instance._selectionVersion ?? 0) + 1;
	}
}
/** @internal Resolve viewport pixels and the active projection's SSE scale for both selectors. */
function getMeshLoDSelectionCamera(camera, context) {
	const position = getCameraPosition(camera);
	const ortho = camera.ortho;
	const targetHeight = context.targetHeight * (camera.viewport?.height ?? 1);
	return {
		position: [
			position.x,
			position.y,
			position.z
		],
		verticalFov: camera.fov,
		perspectivePixelScale: ortho ? void 0 : Math.fround(targetHeight * Math.abs(getProjectionMatrix(camera, getEffectiveAspectRatio(camera, context.targetWidth, context.targetHeight))[5]) / 2),
		near: camera.nearPlane,
		targetWidth: context.targetWidth * (camera.viewport?.width ?? 1),
		targetHeight,
		orthographicHeight: ortho ? (ortho.top ?? ortho.halfHeight) - (ortho.bottom ?? -ortho.halfHeight) : void 0
	};
}
/** Run the deterministic CPU selection oracle for every visible instance in a
*  batch. Coarse-only Phase 4 leaves frustum culling disabled (empty plane list);
*  GPU selection adds it. Returns one result per visible instance, updating each
*  instance's prior hysteresis state in the caller's binding-owned map. */
function selectMeshLoDBatch(batch, context, history) {
	const registeredIds = new Set(batch.instances.map((instance) => instance._instanceId));
	for (const id of history.keys()) if (!registeredIds.has(id)) history.delete(id);
	const camera = context._camera;
	if (!camera || batch.instances.length === 0) return [];
	const runtime = batch.asset._runtime;
	const oracleCamera = getMeshLoDSelectionCamera(camera, context);
	const isPageResident = (pageId) => runtime.gpu.pages[pageId]?.state === "gpu-resident";
	const groupCount = runtime.groups.length;
	const selections = [];
	for (const instance of batch.instances) {
		if (!instance.visible) continue;
		const selectionVersion = instance._selectionVersion ?? 0;
		const prior = history.get(instance._instanceId);
		const wasFineRequired = prior?.selectionVersion === selectionVersion && prior.fineRequired.length === groupCount ? prior.fineRequired : new Uint8Array(groupCount);
		const result = selectMeshLoDCpu({
			groups: runtime.groups,
			clusters: runtime.clusters,
			nodes: runtime.hierarchyNodes,
			pageRecords: runtime.pageRecords,
			groupPageRefs: runtime.groupPageRefs,
			levelCount: runtime.header.levelCount,
			worldMatrix: instance.worldMatrix,
			camera: oracleCamera,
			frustumPlanes: [],
			screenSpaceError: instance.screenSpaceError ?? runtime.settings.screenSpaceError,
			lodHysteresis: runtime.settings.lodHysteresis,
			isPageResident,
			wasFineRequired,
			coneCull: batch.material.doubleSided !== true
		});
		history.set(instance._instanceId, {
			selectionVersion,
			fineRequired: result.fineRequired
		});
		selections.push({
			instance,
			result
		});
	}
	return selections;
}
/** Aggregate one batch's per-instance selection into asset-level fine-page demand and
*  drive the asset's streaming step. Unions each instance's desired pages (keeping the
*  summed float32 benefit before transfer-cost normalization), collects the pages every selected cluster references (so
*  they hold a frame reference and are never evicted while the built frame is in flight),
*  and publishes the visible/fallback/error selection diagnostics. Called once per frame
*  by each material binding after selection, before it writes the draw stream.
*  The producer is that binding's packet, not the shared scene batch. */
function driveMeshLoDStreaming(batch, selections, producer) {
	const runtime = batch.asset._runtime;
	const benefitByPage = /* @__PURE__ */ new Map();
	const referenced = /* @__PURE__ */ new Set();
	let visibleGroupCount = 0;
	let fallbackGroupCount = 0;
	let maximumSelectedErrorPixels = 0;
	let maximumUnmetErrorPixels = 0;
	for (const { result } of selections) {
		for (const [pageId, benefit] of result.pageBenefits) benefitByPage.set(pageId, addMeshLoDPageBenefit(benefitByPage.get(pageId) ?? 0, benefit));
		for (const clusterId of result.selectedClusterIds) referenced.add(runtime.clusters[clusterId].pageId);
		visibleGroupCount = Math.max(visibleGroupCount, result.visibleGroupCount);
		fallbackGroupCount = Math.max(fallbackGroupCount, result.fallbackGroupCount);
		maximumSelectedErrorPixels = Math.max(maximumSelectedErrorPixels, result.maximumSelectedErrorPixels);
		maximumUnmetErrorPixels = Math.max(maximumUnmetErrorPixels, result.maximumUnmetErrorPixels);
	}
	const demand = [];
	for (const [pageId, benefit] of benefitByPage) demand.push({
		pageId,
		priority: benefit / runtime.pageRecords[pageId].storedBytes
	});
	demand.sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : a.pageId - b.pageId);
	const frame = queueMeshLoDFrame(runtime, producer, "cpu", demand, {
		visibleGroupCount,
		fallbackGroupCount,
		maximumSelectedErrorPixels,
		maximumUnmetErrorPixels
	});
	holdMeshLoDPages(runtime, [...referenced], frame, true);
}
export { queueMeshLoDFrame as _, selectMeshLoDBatch as a, _disposeMeshLoDResources as c, _normalizeMeshLoDSelectedClusterIds as d, _recoverMeshLoDAsset as f, publishMeshLoDGpuReadback as g, holdMeshLoDPages as h, removeMeshLoDInstanceFromScene as i, _disposeMeshLoDScheduler as l, finishMeshLoDFrame as m, driveMeshLoDStreaming as n, validateMeshLoDEngine as o, _removeMeshLoDFromScene as p, getMeshLoDSelectionCamera as r, _addMeshLoDToScene as s, addMeshLoDInstanceToScene as t, _loadMeshLoD as u, stepMeshLoDStreaming as v };

//# sourceMappingURL=mesh-lod-scene-BSlMu8U3.js.map