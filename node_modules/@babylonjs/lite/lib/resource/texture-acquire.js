import { acquireGPUTexture } from "./gpu-texture-acquire.js";
// src/resource/texture-acquire.ts
/** Increment ref count on a Texture2D. First acquire sets count to one. */
function acquireTexture(texture) {
	acquireGPUTexture(texture.texture);
}
export { acquireTexture };

//# sourceMappingURL=texture-acquire.js.map