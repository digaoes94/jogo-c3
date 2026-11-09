import { loadTexture2D } from "../../../texture/texture-2d.js";
// src/particle/node/blocks/texture-source-block.ts
/**
* `ParticleTextureSourceBlock` — loads the particle texture from its serialized URL or embedded data URL
* and binds it onto the system for the billboard renderer. The load is registered as a build promise so the
* set is only ready once it settles. Relative URLs use the build's texture base URL.
*/
var particleTextureSourceBlock = { build(block, ctx) {
	const { url: serializedUrl, textureDataUrl, invertY } = block.serialized;
	const rawUrl = typeof serializedUrl === "string" && serializedUrl || typeof textureDataUrl === "string" && textureDataUrl || "";
	const state = ctx.state;
	const base = state.textureBaseUrl;
	const url = rawUrl && base && !/^(https?:)?\/\//.test(rawUrl) && !rawUrl.startsWith("/") ? new URL(rawUrl, base).href : rawUrl;
	if (url) ctx.addBuildPromise((async () => {
		try {
			state.system.texture = await loadTexture2D(ctx.engine, url, { invertY: invertY === false });
		} catch {}
	})());
} };
export { particleTextureSourceBlock };

//# sourceMappingURL=texture-source-block.js.map