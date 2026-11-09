import { TU } from "../engine/gpu-flags.js";
import { acquireTexture } from "../resource/texture-acquire.js";
import { getOrCreateSampler } from "../resource/texture-sampler-pool.js";
// src/texture/texture-2d.ts
/**
* 2D Texture loader — loads an image from URL into a GPU texture.
*
* Supports:
* - rgba8unorm format (standard for diffuse/albedo textures)
* - Automatic mipmap generation via copyExternalImageToTexture
* - UV scaling via a texture matrix
*/
/** Create a fresh Texture2D wrapper that shares GPU resources with `base`
*  but carries its own UV transform. Use this when the same underlying image
*  is referenced with different transforms (e.g. glTF KHR_texture_transform
*  on different textureInfos pointing at the same source). The caller is
*  responsible for acquireTexture/release pairing if the wrapper outlives
*  the base. RTT-derived clones follow replacement attachment generations;
*  ordinary clones snapshot the GPU fields. */
function cloneTexture2D(base, transform) {
	const derived = {
		...base,
		...transform
	};
	_sharedTextureCloneHook?.(base, derived);
	_derivedTextureHook?.(base, derived);
	return derived;
}
var _sharedTextureCloneHook = null;
/** @internal Install clone backing for replaceable facades, independently of recovery tracking. */
function _setSharedTextureCloneHook(hook) {
	_sharedTextureCloneHook = hook;
}
/** Notified when a wrapper is derived from another, so device-lost recovery can track the derived
*  wrapper and carry a rebuilt texture across to it. Installed by the recovery capture, null
*  otherwise, so a scene that never enables recovery carries none of the bookkeeping.
*
*  An ordinary derived wrapper starts as a spread of its base: it inherits `_recoverySource` without ever
*  passing through the capture stamp, so nothing tracks it even though it owns its own `texture`
*  field. Left untracked it survives recovery still holding the lost device's `GPUTexture` — the
*  use-after-free tracking exists to prevent, reached one hop later.
*
*  This is a module-level hook rather than the `engine._dlr` capture seam used everywhere else
*  because `cloneTexture2D` is public API and its glTF callers reach it through
*  `GltfFeature.wrapTexture`, so no engine is in scope. Call sites that do have an engine use
*  `engine._dlr.d` instead, which avoids adding a runtime import edge to this module. */
var _derivedTextureHook = null;
/** @internal Install the device-lost recovery hook for derived texture wrappers. */
function _setDerivedTexture2DHook(hook) {
	_derivedTextureHook = hook;
}
var _tex2dCache = null;
/** Clear the texture cache for a device, releasing cache-held refs. */
function clearTexture2DCache(engine) {
	const device = engine._device;
	_tex2dCache?.delete(device);
}
/** Load an image from `url` into a GPU `Texture2D`, generating mipmaps by default.
*  Results are cached per device by URL + options, so repeated calls with the
*  same arguments share one texture promise.
*  @param engine - Engine context.
*  @param url - Image URL to fetch and decode.
*  @param opts - Sampler, format, and decode overrides.
*  @returns A promise resolving to the uploaded `Texture2D`. */
function loadTexture2D(engine, url, opts = {}) {
	const device = engine._device;
	if (!_tex2dCache) _tex2dCache = /* @__PURE__ */ new WeakMap();
	let dc = _tex2dCache.get(device);
	if (!dc) {
		dc = /* @__PURE__ */ new Map();
		_tex2dCache.set(device, dc);
	}
	const key = `${url}\0${opts.mipMaps ?? true}\0${opts.addressModeU ?? "repeat"}\0${opts.addressModeV ?? "repeat"}\0${opts.minFilter ?? "linear"}\0${opts.magFilter ?? "linear"}\0${opts.invertY ?? true}\0${opts.srgb ?? false}\0${opts.premultiplyAlpha ?? false}`;
	const hit = dc.get(key);
	if (hit) return hit;
	const map = dc;
	const p = loadTexture2DImpl(engine, url, opts);
	map.set(key, p);
	p.catch(() => map.delete(key));
	return p;
}
async function loadTexture2DImpl(engine, url, opts) {
	const device = engine._device;
	const mipMaps = opts.mipMaps ?? true;
	const addressModeU = opts.addressModeU ?? "repeat";
	const addressModeV = opts.addressModeV ?? "repeat";
	const invertY = opts.invertY ?? true;
	const srgb = opts.srgb ?? false;
	const premultiplyAlpha = opts.premultiplyAlpha ?? false;
	const format = srgb ? "rgba8unorm-srgb" : "rgba8unorm";
	const blob = await (await fetch(url)).blob();
	const imageBitmap = await createImageBitmap(blob, {
		premultiplyAlpha: premultiplyAlpha ? "premultiply" : "none",
		colorSpaceConversion: "none"
	});
	const width = imageBitmap.width;
	const height = imageBitmap.height;
	const mipLevelCount = mipMaps ? Math.floor(Math.log2(Math.max(width, height))) + 1 : 1;
	const texture = device.createTexture({
		size: {
			width,
			height
		},
		format,
		mipLevelCount,
		usage: TU.TEXTURE_BINDING | TU.COPY_DST | TU.RENDER_ATTACHMENT
	});
	device.queue.copyExternalImageToTexture({
		source: imageBitmap,
		flipY: invertY
	}, {
		texture,
		premultipliedAlpha: premultiplyAlpha
	}, {
		width,
		height
	});
	imageBitmap.close();
	if (mipMaps && mipLevelCount > 1) {
		const { generateMipmaps } = await import("./generate-mipmaps.js");
		generateMipmaps(engine, texture);
	}
	const minF = opts.minFilter ?? "linear";
	const magF = opts.magFilter ?? "linear";
	const mipF = mipMaps ? "linear" : "nearest";
	const sampler = getOrCreateSampler(engine, {
		addressModeU,
		addressModeV,
		minFilter: minF,
		magFilter: magF,
		mipmapFilter: mipF,
		maxAnisotropy: minF === "linear" && magF === "linear" && mipF === "linear" ? 4 : 1
	});
	const tex2d = {
		texture,
		view: texture.createView(),
		sampler,
		width,
		height
	};
	engine._dlr?.u(tex2d, url, opts);
	acquireTexture(tex2d);
	return tex2d;
}
export { _setDerivedTexture2DHook, _setSharedTextureCloneHook, clearTexture2DCache, cloneTexture2D, loadTexture2D };

//# sourceMappingURL=texture-2d.js.map