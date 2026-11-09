import { getTextureReferenceStore } from "./texture-reference-store.js";
// src/resource/gpu-texture-acquire.ts
/** Increment ownership of one GPU texture allocation. */
function acquireGPUTexture(texture) {
	const references = getTextureReferenceStore();
	references.set(texture, (references.get(texture) ?? 0) + 1);
}
export { acquireGPUTexture };

//# sourceMappingURL=gpu-texture-acquire.js.map