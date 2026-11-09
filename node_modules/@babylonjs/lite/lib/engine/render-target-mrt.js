import { TU } from "./gpu-flags.js";
import { _resolveRenderTargetSize } from "./render-target.js";
// src/engine/render-target-mrt.ts
/**
* RenderTargetMrt — multi-render-target (MRT) variant of {@link RenderTarget}.
*
* Used only by the geometry renderer task (and other future MRT consumers).
* Kept in its own module so that the single-attachment {@link RenderTarget}
* surface — used by every existing scene — stays unchanged and tree-shakes
* away when no MRT consumer is in the bundle.
*
* Differences vs the single-attachment {@link RenderTarget}:
*   - `colorFormats` is a required `readonly GPUTextureFormat[]` (possibly empty).
*   - `_colorTextures` / `_colorViews` are per-attachment arrays.
*   - When `sampleCount > 1`, `_resolveColorTextures` / `_resolveColorViews`
*     hold the single-sample resolve targets for each attachment.
*   - {@link getSampledColorView} / {@link getSampledColorTexture} return the
*     resolved (single-sample) view/texture when MSAA is active, otherwise
*     the render-attachment view/texture.
*
* Geometry renderer wraps each per-type MRT attachment in a plain
* {@link RenderTarget} (single-attachment) by populating its
* `_colorTexture` / `_colorView` from {@link getSampledColorTexture} /
* {@link getSampledColorView}, so downstream tasks (copy-to-texture, post-
* process, etc.) consume per-type geometry attachments through the regular
* single-attachment API.
*/
/** Create an MRT render target descriptor (GPU textures allocated by {@link buildRenderTargetMrt}). */
function createRenderTargetMrt(descriptor) {
	_resolveRenderTargetSize(descriptor);
	return {
		_descriptor: descriptor,
		_colorTextures: [],
		_colorViews: [],
		_resolveColorTextures: [],
		_resolveColorViews: [],
		_depthTexture: null,
		_depthView: null,
		_width: 0,
		_height: 0
	};
}
/** Allocate GPU textures for an MRT render target. */
function buildRenderTargetMrt(rt, engine) {
	disposeRenderTargetMrt(rt);
	const desc = rt._descriptor;
	const { width, height } = _resolveRenderTargetSize(desc);
	rt._width = width;
	rt._height = height;
	const device = engine._device;
	const formats = desc.colorFormats;
	const samples = desc.sampleCount;
	const useResolve = samples > 1;
	const label = desc.label;
	const size = {
		width,
		height
	};
	for (let i = 0; i < formats.length; i++) {
		const fmt = formats[i];
		const colorTex = device.createTexture({
			label,
			size,
			format: fmt,
			sampleCount: samples,
			usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING | TU.COPY_SRC
		});
		rt._colorTextures.push(colorTex);
		rt._colorViews.push(colorTex.createView());
		if (useResolve) {
			const resolveTex = device.createTexture({
				label,
				size,
				format: fmt,
				sampleCount: 1,
				usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING | TU.COPY_SRC
			});
			rt._resolveColorTextures.push(resolveTex);
			rt._resolveColorViews.push(resolveTex.createView());
		}
	}
	if (desc.depthStencilFormat) {
		rt._depthTexture = device.createTexture({
			label,
			size,
			format: desc.depthStencilFormat,
			sampleCount: samples,
			usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING
		});
		rt._depthView = rt._depthTexture.createView();
	}
}
/** Free GPU textures owned by the MRT render target. */
function disposeRenderTargetMrt(rt) {
	for (const t of rt._colorTextures) t.destroy();
	rt._colorTextures.length = 0;
	rt._colorViews.length = 0;
	for (const t of rt._resolveColorTextures) t.destroy();
	rt._resolveColorTextures.length = 0;
	rt._resolveColorViews.length = 0;
	if (rt._depthTexture) {
		rt._depthTexture.destroy();
		rt._depthTexture = null;
		rt._depthView = null;
	}
	rt._width = 0;
	rt._height = 0;
}
/** Return the view that downstream samplers should read for attachment `i`:
*  the resolved (single-sample) view when MSAA is active, otherwise the
*  render-attachment view. */
function getSampledColorView(rt, i) {
	return rt._resolveColorViews[i] ?? rt._colorViews[i];
}
/** Return the texture that downstream samplers should read for attachment `i`.
*  Mirrors {@link getSampledColorView}. */
function getSampledColorTexture(rt, i) {
	return rt._resolveColorTextures[i] ?? rt._colorTextures[i];
}
export { buildRenderTargetMrt, createRenderTargetMrt, disposeRenderTargetMrt, getSampledColorTexture, getSampledColorView };

//# sourceMappingURL=render-target-mrt.js.map