import { BU } from "../engine/gpu-flags.js";
import { createMeshLoDError } from "./mesh-lod-errors.js";
import { PAGE_ALIGNMENT } from "./mesh-lod-format.js";
// src/mesh-lod/mesh-lod-cache.ts
/** MeshLoD GPU cache — the immutable geometry arena and its 64 KiB block allocator.
*
*  One storage arena is allocated at the immutable rounded `cacheCapacityBytes`
*  (architecture 11.4). Residency is tracked in fixed 64 KiB blocks: pinned coarse
*  pages are allocated first at the start of the arena, and later fine pages take
*  64–256 KiB contiguous runs via deterministic first-fit. The allocator only owns
*  block bookkeeping and the arena `GPUBuffer`; page decode/upload and eviction
*  policy live in the runtime/scheduler. */
/** 64 KiB allocation block — the arena's granularity. */
var ARENA_BLOCK_BYTES = PAGE_ALIGNMENT;
/** Round a byte length down to a whole number of 64 KiB blocks. */
function floorToBlocks(bytes) {
	return Math.floor(bytes / ARENA_BLOCK_BYTES) * ARENA_BLOCK_BYTES;
}
/** Round a page's meaningful byte length up to its 64 KiB-multiple allocation,
*  with a 64 KiB minimum — mirrors the converter's `pageAllocation`. */
function roundPageAllocation(bytes) {
	const rounded = Math.ceil(bytes / ARENA_BLOCK_BYTES) * ARENA_BLOCK_BYTES;
	return Math.max(rounded, ARENA_BLOCK_BYTES);
}
/** Total rounded arena bytes required by every pinned page. This is the minimum
*  viable capacity/budget: loading fails with `MLOD_BUDGET_TOO_SMALL` below it. */
function pinnedAllocationBytes(pageRecords) {
	let total = 0;
	for (const page of pageRecords) if (page.pinned) total += roundPageAllocation(page.decodedBytes);
	return total;
}
/** Create the immutable geometry arena. `capacityBytes` is rounded down to a whole
*  number of 64 KiB blocks and clamped to the device's storage-buffer limits; a
*  capacity that cannot hold `minimumBytes` (the pinned allocation) throws
*  `MLOD_DEVICE_LIMIT`. */
function createMeshLoDArena(engine, capacityBytes, minimumBytes, label) {
	const limits = engine._device.limits;
	const deviceCap = Math.min(limits?.maxStorageBufferBindingSize ?? capacityBytes, limits?.maxBufferSize ?? capacityBytes);
	const rounded = floorToBlocks(Math.min(capacityBytes, deviceCap));
	if (rounded < minimumBytes || rounded < ARENA_BLOCK_BYTES) throw createMeshLoDError("MLOD_DEVICE_LIMIT", "device storage limits cannot hold the pinned geometry arena", {
		expected: minimumBytes,
		actual: rounded
	});
	const blockCount = rounded / ARENA_BLOCK_BYTES;
	return {
		capacityBytes: rounded,
		blockCount,
		buffer: engine._device.createBuffer({
			label: label ?? "mesh-lod-arena",
			size: rounded,
			usage: BU.STORAGE | BU.COPY_DST
		}),
		blocks: new Uint8Array(blockCount),
		pinnedBlocks: new Uint8Array(blockCount),
		committedBlocks: 0,
		pinnedCount: 0
	};
}
/** Reserve a contiguous 64–256 KiB run for a decoded page using deterministic
*  first-fit. Returns the byte offset of the run, or `null` when no contiguous run
*  of the required block count is free. Pinned pages must allocate before any fine
*  pages so they occupy the arena prefix. */
function allocateArenaRun(arena, decodedBytes, pinned) {
	const runBytes = roundPageAllocation(decodedBytes);
	if (runBytes > 262144) return null;
	const need = runBytes / ARENA_BLOCK_BYTES;
	const { blocks, pinnedBlocks, blockCount } = arena;
	let start = 0;
	while (start + need <= blockCount) {
		let free = 0;
		while (free < need && blocks[start + free] === 0) free++;
		if (free === need) {
			for (let i = 0; i < need; i++) {
				blocks[start + i] = 1;
				pinnedBlocks[start + i] = pinned ? 1 : 0;
			}
			arena.committedBlocks += need;
			if (pinned) arena.pinnedCount += need;
			return start * ARENA_BLOCK_BYTES;
		}
		start += free + 1;
	}
	return null;
}
/** Release a previously allocated run. Pinned runs are never freed except on
*  disposal/device loss. */
function freeArenaRun(arena, byteOffset, decodedBytes) {
	const need = roundPageAllocation(decodedBytes) / ARENA_BLOCK_BYTES;
	const startBlock = byteOffset / ARENA_BLOCK_BYTES;
	for (let i = 0; i < need; i++) {
		const b = startBlock + i;
		if (arena.blocks[b] === 1) {
			arena.blocks[b] = 0;
			arena.committedBlocks--;
			if (arena.pinnedBlocks[b] === 1) arena.pinnedCount--;
			arena.pinnedBlocks[b] = 0;
		}
	}
}
/** Bytes currently committed to resident blocks. */
function arenaUsedBytes(arena) {
	return arena.committedBlocks * ARENA_BLOCK_BYTES;
}
/** Destroy the arena's GPU buffer. Idempotent-safe when called once during disposal. */
function destroyMeshLoDArena(arena) {
	arena.buffer.destroy();
	arena.blocks.fill(0);
	arena.pinnedBlocks.fill(0);
	arena.committedBlocks = 0;
	arena.pinnedCount = 0;
}
/** A resident fine page is an eviction candidate only when it is unpinned, fully
*  GPU-resident (never mid-fetch/decode/upload), unreferenced by the current frame,
*  and older than the residency hold (REQ-CACHE-3, REQ-CACHE-4). */
function isEvictable(page, record, policy) {
	return page.state === "gpu-resident" && !record.pinned && page.frameRefCount === 0 && page.arenaOffset >= 0 && page.arenaBytes > 0 && policy.currentFrame - page.lastUsedFrame >= policy.residencyHoldFrames;
}
/** Victim priority: oldest last-used first, then lower demand priority, then higher
*  page id (architecture §11.4). Returns true when `a` should be evicted before `b`. */
function victimBefore(a, b) {
	if (a.lastUsedFrame !== b.lastUsedFrame) return a.lastUsedFrame < b.lastUsedFrame;
	if (a.priority !== b.priority) return a.priority < b.priority;
	return a.id > b.id;
}
function pickVictim(pages, records, policy) {
	let best = null;
	for (const page of pages) {
		if (!isEvictable(page, records[page.id], policy)) continue;
		if (!best || victimBefore(page, best)) best = page;
	}
	return best;
}
/** Free a resident page's arena run and reset its runtime record to `unrequested`,
*  appending its id to `evicted` for GPU page-state sync. */
function evictMeshLoDPage(arena, page, evicted) {
	if (page.arenaOffset >= 0 && page.arenaBytes > 0) freeArenaRun(arena, page.arenaOffset, page.arenaBytes);
	page.state = "unrequested";
	page.arenaOffset = -1;
	page.arenaBytes = 0;
	page.indices = null;
	page.frameRefCount = 0;
	page.priority = 0;
	evicted.push(page.id);
}
/** Reserve a contiguous decoded-page run for a fine page within the effective budget,
*  evicting eligible resident victims (oldest use, then lower priority, then higher id)
*  first to satisfy the budget and then to defragment. Every evicted page's id is
*  appended to `evicted` so the caller can sync GPU page-state and diagnostics. Returns
*  the reserved byte offset, or `null` when the page cannot fit without evicting
*  protected (pinned / current-frame / in-flight / young) pages — in which case nothing
*  is allocated and the page stays pending for a later frame (REQ-CACHE-1, §11.4). */
function reserveMeshLoDArenaRun(arena, pages, records, decodedBytes, policy, evicted) {
	const newBytes = roundPageAllocation(decodedBytes);
	if (newBytes > 262144) return null;
	while (arenaUsedBytes(arena) + newBytes > policy.budgetBytes) {
		const victim = pickVictim(pages, records, policy);
		if (!victim) return null;
		evictMeshLoDPage(arena, victim, evicted);
	}
	let offset = allocateArenaRun(arena, decodedBytes, false);
	while (offset === null) {
		const victim = pickVictim(pages, records, policy);
		if (!victim) return null;
		evictMeshLoDPage(arena, victim, evicted);
		offset = allocateArenaRun(arena, decodedBytes, false);
	}
	return offset;
}
/** Evict eligible resident victims (oldest use, then lower priority, then higher id)
*  until committed residency fits within `policy.budgetBytes`, or no eligible victim
*  remains. Applies a lowered effective `cacheBudgetBytes` deterministically without
*  touching pinned, current-frame-referenced, in-flight, or held pages. Every evicted
*  id is appended to `evicted` for GPU page-state and diagnostics sync (§11.4). */
function evictMeshLoDToBudget(arena, pages, records, policy, evicted) {
	while (arenaUsedBytes(arena) > policy.budgetBytes) {
		const victim = pickVictim(pages, records, policy);
		if (!victim) return;
		evictMeshLoDPage(arena, victim, evicted);
	}
}
/** Stop advertising cold pages until the budget and an optional replacement run
*  fit after pending retirements. Submitted GPU references fence actual reclamation. */
function retireMeshLoDToBudget(arena, pages, records, policy, evicted, requiredBytes = 0) {
	const newBytes = requiredBytes > 0 ? roundPageAllocation(requiredBytes) : 0;
	if (newBytes > 262144 || arena.pinnedCount * ARENA_BLOCK_BYTES + newBytes > policy.budgetBytes) return;
	const available = newBytes ? {
		...arena,
		blocks: arena.blocks.slice(),
		pinnedBlocks: arena.pinnedBlocks.slice()
	} : null;
	let retiringBytes = 0;
	for (const page of pages) if (page.state === "evicting") {
		retiringBytes += roundPageAllocation(page.arenaBytes);
		if (available) freeArenaRun(available, page.arenaOffset, page.arenaBytes);
	}
	while (arenaUsedBytes(arena) - retiringBytes + newBytes > policy.budgetBytes || available && allocateArenaRun(available, requiredBytes, false) === null) {
		let victim = null;
		for (const page of pages) if (page.state === "gpu-resident" && !records[page.id].pinned && page.arenaOffset >= 0 && page.lastUsedFrame < policy.currentFrame && policy.currentFrame - page.lastUsedFrame >= policy.residencyHoldFrames && (!victim || victimBefore(page, victim))) victim = page;
		if (!victim) return;
		if (available) freeArenaRun(available, victim.arenaOffset, victim.arenaBytes);
		if (victim.frameRefCount > 0) {
			victim.state = "evicting";
			retiringBytes += roundPageAllocation(victim.arenaBytes);
		} else evictMeshLoDPage(arena, victim, evicted);
	}
}
function createMeshLoDCpuPageCache(budgetBytes) {
	return {
		budgetBytes,
		usedBytes: 0,
		entries: /* @__PURE__ */ new Map()
	};
}
/** Bytes currently retained by the CPU encoded-page cache. */
function cpuCacheUsedBytes(cache) {
	return cache.usedBytes;
}
/** Evict unpinned entries by oldest last-used (ties: higher id) until within budget or
*  no evictable entry remains. `protectId` is never evicted (the just-inserted page). */
function evictCpuToFit(cache, protectId) {
	while (cache.usedBytes > cache.budgetBytes) {
		let victimId = -1;
		let victim = null;
		for (const [id, entry] of cache.entries) {
			if (entry.pinned || id === protectId) continue;
			if (!victim || entry.lastUsed < victim.lastUsed || entry.lastUsed === victim.lastUsed && id > victimId) {
				victim = entry;
				victimId = id;
			}
		}
		if (!victim) return;
		cache.usedBytes -= victim.bytes.byteLength;
		cache.entries.delete(victimId);
	}
}
/** Retain a page's encoded bytes, then evict unpinned entries to fit the budget. The
*  just-inserted page is protected from this call's eviction. */
function putMeshLoDCpuPage(cache, pageId, bytes, pinned, frame) {
	const existing = cache.entries.get(pageId);
	if (existing) {
		cache.usedBytes += bytes.byteLength - existing.bytes.byteLength;
		existing.bytes = bytes;
		existing.pinned = existing.pinned || pinned;
		existing.lastUsed = frame;
	} else {
		cache.entries.set(pageId, {
			bytes,
			pinned,
			lastUsed: frame
		});
		cache.usedBytes += bytes.byteLength;
	}
	evictCpuToFit(cache, pageId);
}
/** Return a retained page's encoded bytes (touching its last-used frame), or `null`. */
function getMeshLoDCpuPage(cache, pageId, frame) {
	const entry = cache.entries.get(pageId);
	if (!entry) return null;
	entry.lastUsed = frame;
	return entry.bytes;
}
/** Refresh a retained page's last-used frame without reading its bytes. */
function touchMeshLoDCpuPage(cache, pageId, frame) {
	const entry = cache.entries.get(pageId);
	if (entry) entry.lastUsed = frame;
}
/** Apply a new CPU-cache byte budget and evict unpinned entries to fit. */
function setMeshLoDCpuCacheBudget(cache, budgetBytes) {
	cache.budgetBytes = budgetBytes;
	evictCpuToFit(cache, -1);
}
/** Drop every retained entry (pinned and unpinned) and reset the used byte count.
*  Called on asset disposal once scene registries have stopped drawing the asset, so
*  retained encoded bytes and decoded metadata are released (§14.2). */
function clearMeshLoDCpuPageCache(cache) {
	cache.entries.clear();
	cache.usedBytes = 0;
}
export { ARENA_BLOCK_BYTES, allocateArenaRun, arenaUsedBytes, clearMeshLoDCpuPageCache, cpuCacheUsedBytes, createMeshLoDArena, createMeshLoDCpuPageCache, destroyMeshLoDArena, evictMeshLoDPage, evictMeshLoDToBudget, floorToBlocks, freeArenaRun, getMeshLoDCpuPage, pinnedAllocationBytes, putMeshLoDCpuPage, reserveMeshLoDArenaRun, retireMeshLoDToBudget, roundPageAllocation, setMeshLoDCpuCacheBudget, touchMeshLoDCpuPage };

//# sourceMappingURL=mesh-lod-cache.js.map