import { getTextureReferenceStore } from "./texture-reference-store.js";
// src/resource/texture-owner-state.ts
/** Whether every owner released this Texture2D's current GPUTexture. */
function _isTextureReleased(texture) {
	return getTextureReferenceStore().get(texture.texture) === 0;
}
/** Number of owners holding this Texture2D's current GPUTexture. */
function _textureOwners(texture) {
	return getTextureReferenceStore().get(texture.texture) ?? 0;
}
export { _isTextureReleased, _textureOwners };

//# sourceMappingURL=texture-owner-state.js.map