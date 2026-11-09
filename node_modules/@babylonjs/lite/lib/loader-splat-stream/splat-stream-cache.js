import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
import { createSplatStreamGpuLedger } from "./splat-stream-gpu-ledger.js";
// src/loader-splat-stream/splat-stream-cache.ts
function destroyResources(resources) {
	for (const texture of resources.textures) texture.destroy();
	resources.metadataBuffer.destroy();
}
/** @internal Creates a per-stream, allocation-free-at-import source cache. */
function createSplatSourceCache(maxGpuBytes, maxCpuBytes, retire = (dispose) => dispose(), sharedLedger, getDistanceToCamera) {
	if (!Number.isSafeInteger(maxGpuBytes) || maxGpuBytes <= 0 || !Number.isSafeInteger(maxCpuBytes) || maxCpuBytes <= 0) throw new RangeError("[GaussianSplatStream] cache budgets must be positive safe integers");
	return {
		maxGpuBytes,
		maxCpuBytes,
		entries: /* @__PURE__ */ new Map(),
		ledger: sharedLedger ?? createSplatStreamGpuLedger(maxGpuBytes, retire),
		residentGpuBytes: 0,
		allocatedGpuBytes: 0,
		retiringGpuBytes: 0,
		residentCpuBytes: 0,
		admissionVersion: 0,
		disposed: false,
		retire,
		getDistanceToCamera
	};
}
/** @internal Creates a retirement hook fenced behind the engine's next submitted frame. */
function createSplatSourceRetirement(engine) {
	return (dispose) => retireGpuResources(engine, dispose);
}
function isProtected(entry) {
	return entry.pinCount > 0 || entry.displayedRefs > 0 || entry.pendingRefs > 0 || entry.activeRefs > 0;
}
function evictionCandidates(cache, excluded) {
	return [...cache.entries.values()].filter((entry) => entry !== excluded && !isProtected(entry)).map((entry) => ({
		entry,
		distance: cache.getDistanceToCamera?.(entry.url) ?? Infinity
	})).sort((a, b) => b.distance - a.distance || a.entry.lastUsedFrame - b.entry.lastUsedFrame || b.entry.gpuBytes - a.entry.gpuBytes || a.entry.url.localeCompare(b.entry.url)).map(({ entry }) => entry);
}
function retireEntry(cache, entry) {
	cache.entries.delete(entry.url);
	cache.residentGpuBytes -= entry.gpuBytes;
	cache.residentCpuBytes -= entry.cpuBytes;
	cache.retiringGpuBytes += entry.gpuBytes;
	cache.admissionVersion++;
	cache.ledger.retire(entry.gpuBytes, () => {
		destroyResources(entry.resources);
		cache.allocatedGpuBytes -= entry.gpuBytes;
		cache.retiringGpuBytes -= entry.gpuBytes;
		cache.admissionVersion++;
	});
}
function additionalRetirementRequired(cache, bytes) {
	return Math.max(0, cache.ledger.allocatedBytes + cache.ledger.heldBytes + bytes - cache.ledger.maxBytes - cache.retiringGpuBytes);
}
/** @internal Returns whether an immediate reservation or enough newly eligible source retirement can satisfy the request. */
function canReserveSplatSourceGpuBytes(cache, bytes) {
	if (cache.disposed || !Number.isSafeInteger(bytes) || bytes < 0 || bytes > cache.maxGpuBytes) return false;
	if (cache.ledger.allocatedBytes + cache.ledger.heldBytes + bytes <= cache.ledger.maxBytes) return true;
	const required = additionalRetirementRequired(cache, bytes);
	if (required === 0) return false;
	let reclaimable = 0;
	for (const entry of cache.entries.values()) if (!isProtected(entry)) {
		reclaimable += entry.gpuBytes;
		if (reclaimable >= required) return true;
	}
	return false;
}
/** @internal Reserves source bytes after scheduling the minimum unprotected farthest-first retirement. */
function reserveSplatSourceGpuBytes(cache, bytes, onEvict) {
	if (cache.disposed || !Number.isSafeInteger(bytes) || bytes < 0 || bytes > cache.maxGpuBytes) return false;
	if (cache.ledger.tryReserve(bytes)) return true;
	const required = additionalRetirementRequired(cache, bytes);
	if (required === 0) return false;
	const candidates = evictionCandidates(cache);
	const victims = [];
	let reclaimable = 0;
	for (const candidate of candidates) {
		victims.push(candidate);
		reclaimable += candidate.gpuBytes;
		if (reclaimable >= required) break;
	}
	if (reclaimable < required) return false;
	for (const victim of victims) {
		onEvict(victim);
		retireEntry(cache, victim);
	}
	return cache.ledger.tryReserve(bytes);
}
/** @internal Returns true after admitting the entry, evicting only unprotected farthest-first candidates. */
function admitSplatSource(cache, entry) {
	if (cache.disposed) {
		destroyResources(entry.resources);
		if (entry.gpuReserved) cache.ledger.release(entry.gpuBytes);
		return false;
	}
	const releaseRejected = () => {
		destroyResources(entry.resources);
		if (entry.gpuReserved) cache.ledger.release(entry.gpuBytes);
	};
	if (entry.gpuBytes > cache.maxGpuBytes || entry.cpuBytes > cache.maxCpuBytes) {
		releaseRejected();
		return false;
	}
	const existing = cache.entries.get(entry.url);
	if (existing && existing.generation === entry.generation) {
		releaseRejected();
		return true;
	}
	const excludedGpu = existing?.gpuBytes ?? 0;
	const excludedCpu = existing?.cpuBytes ?? 0;
	let gpu = cache.residentGpuBytes - excludedGpu + entry.gpuBytes;
	let cpu = cache.residentCpuBytes - excludedCpu + entry.cpuBytes;
	const candidates = gpu > cache.maxGpuBytes || cpu > cache.maxCpuBytes ? evictionCandidates(cache, existing) : [];
	const victims = [];
	for (const candidate of candidates) {
		if (gpu <= cache.maxGpuBytes && cpu <= cache.maxCpuBytes) break;
		victims.push(candidate);
		gpu -= candidate.gpuBytes;
		cpu -= candidate.cpuBytes;
	}
	const requiredReservation = entry.gpuReserved ? 0 : entry.gpuBytes;
	if (gpu > cache.maxGpuBytes || cpu > cache.maxCpuBytes || existing && isProtected(existing) || !cache.ledger.tryReserve(requiredReservation)) {
		releaseRejected();
		return false;
	}
	for (const victim of victims) retireEntry(cache, victim);
	if (existing) retireEntry(cache, existing);
	cache.entries.set(entry.url, entry);
	cache.residentGpuBytes += entry.gpuBytes;
	cache.allocatedGpuBytes += entry.gpuBytes;
	cache.residentCpuBytes += entry.cpuBytes;
	cache.admissionVersion++;
	return true;
}
/** @internal Updates reference protections without exposing cache-owned GPU handles publicly. */
function setSplatSourceProtection(cache, url, refs) {
	const entry = cache.entries.get(url);
	if (!entry) return;
	const protectedBefore = isProtected(entry);
	for (const key of [
		"pinCount",
		"displayedRefs",
		"pendingRefs",
		"activeRefs",
		"lastUsedFrame"
	]) {
		const value = refs[key];
		if (value !== void 0) {
			if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`[GaussianSplatStream] cache ${key} must be a nonnegative safe integer`);
			entry[key] = value;
		}
	}
	if (protectedBefore !== isProtected(entry)) cache.admissionVersion++;
}
/** @internal Evicts one resident source when it is no longer protected. */
function evictSplatSource(cache, url) {
	const entry = cache.entries.get(url);
	if (!entry || isProtected(entry)) return false;
	retireEntry(cache, entry);
	return true;
}
/** @internal Idempotently retires every cache-owned source. */
function disposeSplatSourceCache(cache) {
	if (cache.disposed) return;
	cache.disposed = true;
	for (const entry of [...cache.entries.values()]) retireEntry(cache, entry);
}
export { admitSplatSource, canReserveSplatSourceGpuBytes, createSplatSourceCache, createSplatSourceRetirement, disposeSplatSourceCache, evictSplatSource, reserveSplatSourceGpuBytes, setSplatSourceProtection };

//# sourceMappingURL=splat-stream-cache.js.map