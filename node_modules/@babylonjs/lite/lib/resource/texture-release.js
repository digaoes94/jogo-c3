import { _setTextureReleaseHook, releaseTextureAllocation } from "./texture-allocation-release.js";
// src/resource/texture-release.ts
/** Decrement ref count on a Texture2D. Destroys, notifies, then records zero at release. */
function releaseTexture(texture) {
	return releaseTextureAllocation(texture.texture, texture);
}
export { _setTextureReleaseHook, releaseTexture };

//# sourceMappingURL=texture-release.js.map