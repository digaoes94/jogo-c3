import { createEmptyUniformBuffer } from "../resource/empty-uniform-buffer.js";
import "./text-data.js";
import { ensureSharedAtlasGpu } from "./_gpu/text-textures.js";
import { createStyleBuffer } from "./_gpu/text-style-gpu.js";
// src/text/text-recovery.ts
var TEXT_UBO_BYTES = 96;
/**
* Rebuild every registered TextRenderer on the replacement device.
* This module is reached only through the Text recovery adapter's lazy import.
*/
function rebuildRegisteredTextRenderers(engine) {
	for (const surface of engine.surfaces) for (const context of surface._renderingContexts) {
		if (context._kind !== "text-renderer") continue;
		rebuildTextRendererGpu(context);
	}
}
function rebuildTextRendererGpu(renderer) {
	const engine = renderer._surface.engine;
	const device = engine._device;
	renderer._visibleBundles.length = 0;
	for (const lg of renderer._layerGpu.values()) {
		lg._textU = createEmptyUniformBuffer(engine, TEXT_UBO_BYTES, "text-layer-ubo");
		lg._instanceBuf = device.createBuffer({
			label: "text-layer-instances",
			size: lg._instanceCap * 12,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
		});
		lg._styleBuf = createStyleBuffer(device, lg._styleBuf.size / 32);
		lg._uploadedStyleVersion = -1;
		lg._pipeline = null;
		lg._bindGroupCache.length = 0;
		lg._uploadedDataVersion = -1;
		lg._uploadedViewportW = 0;
		lg._uploadedViewportH = 0;
		lg._lastMvpInputs.fill(0);
		lg._mvpUploaded = false;
		lg._renderBundle = null;
		lg._bundleLayoutVersion = -1;
		lg._bundleDrawCalls = 0;
	}
	for (const layer of renderer.layers) for (const group of layer.data._groups) ensureSharedAtlasGpu(device, group._curveSet._atlas);
	renderer._update();
}
export { rebuildRegisteredTextRenderers };

//# sourceMappingURL=text-recovery.js.map