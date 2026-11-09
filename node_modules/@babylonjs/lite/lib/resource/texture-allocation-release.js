import { getTextureReferenceStore } from "./texture-reference-store.js";
// src/resource/texture-allocation-release.ts
var _textureReleaseHook = null;
/** @internal Install the opaque release seam used by opt-in resource capture. */
function _setTextureReleaseHook(hook) {
	_textureReleaseHook = hook;
}
/** @internal Release a captured allocation; facade notifications precede its retained-zero update. */
function releaseTextureAllocation(allocation, facade) {
	const references = getTextureReferenceStore();
	const count = (references.get(allocation) ?? 1) - 1;
	if (count <= 0) {
		allocation.destroy();
		if (facade) _textureReleaseHook?.(facade);
		references.set(allocation, 0);
		return true;
	}
	references.set(allocation, count);
	return false;
}
export { _setTextureReleaseHook, releaseTextureAllocation };

//# sourceMappingURL=texture-allocation-release.js.map