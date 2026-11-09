// src/resource/ref-count.ts
/** @internal Register an additional owner of a shared resource. */
function retain(resource) {
	resource._refCount = (resource._refCount ?? 1) + 1;
}
/** @internal Release one owner's claim on a shared resource. Returns `true` when this
*  was the last claim — the caller should now destroy the underlying GPU buffers. A
*  resource that was never retained (never cloned) also returns `true` on its first (and
*  only) release, since it has exactly one implicit owner. */
function release(resource) {
	const count = resource._refCount;
	if (count === void 0 || count <= 1) return true;
	resource._refCount = count - 1;
	return false;
}
export { release, retain };

//# sourceMappingURL=ref-count.js.map