import { gpsRenderTask } from "./gps-pass.js";
// src/gaussian-point-splatting/gps-scene-depth.ts
function gpsHasViewport(context) {
	const camera = context?._camera;
	if (!camera || !context) return false;
	if (context.targetWidth <= 0 || context.targetHeight <= 0 || camera.viewport && (camera.viewport.width <= 0 || camera.viewport.height <= 0)) return false;
	const { width, height } = gpsViewport(context);
	return width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height);
}
function gpsViewport(context) {
	const viewport = context._camera?.viewport;
	const x = Math.floor((viewport?.x ?? 0) * context.targetWidth);
	const y = Math.floor((viewport ? 1 - viewport.y - viewport.height : 0) * context.targetHeight);
	const right = Math.ceil((viewport ? viewport.x + viewport.width : 1) * context.targetWidth);
	const bottom = Math.ceil((viewport ? 1 - viewport.y : 1) * context.targetHeight);
	return {
		x,
		y,
		width: right - x,
		height: bottom - y
	};
}
function gpsOpaqueSources(scene, signature) {
	return gpsRenderTask(scene, signature)?._renderables ?? scene._renderables;
}
function gpsCreateSceneDepth() {
	return {
		texture: null,
		view: null,
		active: false,
		signature: null,
		samples: 1,
		x: 0,
		y: 0
	};
}
function gpsRecordSceneDepth(state, scene, _engine, signature, context, precedingDraws) {
	state.active = false;
	if (!gpsHasViewport(context)) return false;
	const config = gpsRenderTask(scene, signature)?._config;
	const target = config && (config.depth ?? config.rt);
	const texture = target?._depthTexture ?? null;
	const loaded = config && (config.depth ? target?._eager : config.depthClear === false);
	if (!texture || !loaded && !(precedingDraws ?? gpsOpaqueSources(scene, signature).some((renderable) => !renderable.isTransparent))) return false;
	if (state.texture !== texture) {
		state.texture = texture;
		state.view = texture.createView({ aspect: "depth-only" });
	}
	state.active = true;
	state.signature = signature;
	state.samples = signature._sampleCount;
	const viewport = gpsViewport(context);
	state.x = viewport.x;
	state.y = viewport.y;
	return true;
}
export { gpsCreateSceneDepth, gpsHasViewport, gpsOpaqueSources, gpsRecordSceneDepth, gpsViewport };

//# sourceMappingURL=gps-scene-depth.js.map