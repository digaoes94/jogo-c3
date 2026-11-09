// src/particle/node/blocks/cpu-texture-source-block.ts
/** Publish a CPU-readable texture value only when a texture source feeds a CPU texture update. */
var cpuTextureSourceBlock = { build(block, ctx) {
	const rawUrl = (typeof block.serialized.textureDataUrl === "string" ? block.serialized.textureDataUrl : "") || (typeof block.serialized.url === "string" ? block.serialized.url : "");
	const base = ctx.state.textureBaseUrl;
	const absolute = /^(https?:)?\/\//.test(rawUrl) || rawUrl.startsWith("/");
	const value = {
		url: /^(?!https?:|data:|blob:)[a-z][a-z\d+.-]*:/i.test(rawUrl) ? "" : rawUrl && base && !absolute ? new URL(rawUrl, base).href : rawUrl,
		invertY: block.serialized.invertY !== false
	};
	ctx.setOutput(block.id, "texture", (() => value));
} };
export { cpuTextureSourceBlock };

//# sourceMappingURL=cpu-texture-source-block.js.map