import { acquireGPUTexture } from "./gpu-texture-acquire.js";
import { _setTextureReleaseHook } from "./texture-allocation-release.js";
import { releaseGPUTexture } from "./gpu-texture-release.js";
import { acquireTexture } from "./texture-acquire.js";
import { releaseTexture } from "./texture-release.js";
import { _isTextureReleased, _textureOwners } from "./texture-owner-state.js";
import { clearSamplerCache } from "./texture-sampler-pool.js";
import { getOrCreateSampler } from "./sampler-pool.js";
export { _isTextureReleased, _setTextureReleaseHook, _textureOwners, acquireGPUTexture, acquireTexture, clearSamplerCache, getOrCreateSampler, releaseGPUTexture, releaseTexture };
