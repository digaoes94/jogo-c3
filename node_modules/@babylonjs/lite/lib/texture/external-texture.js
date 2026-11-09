// src/texture/external-texture.ts
/** Wrap a caller-owned video for ShaderMaterial external-texture bindings. */
function createExternalTexture(video) {
	return { video };
}
/** Whether the wrapped video currently exposes frame data that WebGPU can import. */
function isExternalTextureReady(texture) {
	const video = texture.video;
	return video.readyState >= video.HAVE_CURRENT_DATA;
}
export { createExternalTexture, isExternalTextureReady };

//# sourceMappingURL=external-texture.js.map