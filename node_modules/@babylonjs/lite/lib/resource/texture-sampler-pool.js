// src/resource/texture-sampler-pool.ts
var samplerCaches = null;
var defaultFilter = "nearest";
var defaultAddressMode = "clamp-to-edge";
var textureSamplerDefaults = {
	minFilter: defaultFilter,
	magFilter: defaultFilter,
	mipmapFilter: defaultFilter,
	addressModeU: defaultAddressMode,
	addressModeV: defaultAddressMode,
	addressModeW: defaultAddressMode,
	maxAnisotropy: 1
};
function getOrCreateSampler(engine, descriptor = {}, extraKey = "") {
	const device = engine._device;
	const caches = samplerCaches ??= /* @__PURE__ */ new WeakMap();
	let cache = caches.get(device);
	if (!cache) caches.set(device, cache = /* @__PURE__ */ new Map());
	let key = extraKey;
	for (const property in textureSamplerDefaults) {
		const field = property;
		key += `:${descriptor[field] ?? textureSamplerDefaults[field]}`;
	}
	let sampler = cache.get(key);
	if (!sampler) cache.set(key, sampler = device.createSampler(descriptor));
	return sampler;
}
/** Clear sampler cache for one device. */
function clearSamplerCache(engine) {
	samplerCaches?.delete(engine._device);
}
/** @internal Recover ordinary sampler settings from this pool's canonical descriptor key without retaining another cache. */
function getTextureSamplerDescriptor(engine, sampler) {
	const cache = samplerCaches?.get(engine._device);
	if (cache) {
		const fields = Object.keys(textureSamplerDefaults);
		for (const [key, value] of cache) if (value === sampler) {
			const values = key.split(":").slice(-fields.length);
			return Object.fromEntries(fields.map((field, i) => [field, typeof textureSamplerDefaults[field] === "number" ? Number(values[i]) : values[i]]));
		}
	}
}
export { clearSamplerCache, getOrCreateSampler, getTextureSamplerDescriptor };

//# sourceMappingURL=texture-sampler-pool.js.map