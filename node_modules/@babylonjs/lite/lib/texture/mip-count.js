// src/texture/mip-count.ts
/** Calculate full mip chain count for a given width/height. */
function mipLevelCount(width, height) {
	return Math.floor(Math.log2(Math.max(width, height))) + 1;
}
/** Calculate mip levels needed by transmission refraction, whose shader samples with a fixed LOD bias. */
function biasedMipLevelCount(width, height, lodBias) {
	return Math.max(1, Math.floor(Math.log2(Math.max(width, height)) - lodBias) + 1);
}
export { biasedMipLevelCount, mipLevelCount };

//# sourceMappingURL=mip-count.js.map