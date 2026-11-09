import { registerRenderingContext, unregisterRenderingContext } from "../engine/engine.js";
import { createFrameGraph } from "./frame-graph.js";
// src/frame-graph/frame-graph-context.ts
/** Create a scene-less frame-graph context bound to `surface`, for fullscreen effects
*  and post-process chains. Pass the engine directly for the single-canvas case (since
*  `EngineContext extends SurfaceContext`); pass an auxiliary surface for multi-canvas. */
function createFrameGraphContext(surface, options) {
	const engine = surface.engine;
	const update = options?.update;
	const ctx = {
		_kind: "frame-graph-context",
		name: options?.name ?? "frame-graph",
		surface,
		frameGraph: createFrameGraph(engine),
		clearColor: options?.clearColor ?? {
			r: 0,
			g: 0,
			b: 0,
			a: 1
		},
		_drawCallsPre: 0,
		_disposed: false,
		_update() {
			if (ctx._disposed) return;
			update?.(engine._currentDelta);
		},
		_record() {
			if (ctx._disposed) return 0;
			return ctx.frameGraph.execute();
		},
		_resize() {
			if (ctx._disposed) return;
			ctx.frameGraph.build();
		}
	};
	return ctx;
}
/** Build and register the standalone frame-graph context with its surface. */
function registerFrameGraphContext(ctx) {
	if (ctx._disposed) return;
	ctx.frameGraph.build();
	registerRenderingContext(ctx.surface, ctx);
}
/** Prepare task-owned async resources, then build and register a standalone frame graph. */
async function registerFrameGraphContextAsync(ctx) {
	const internal = ctx;
	if (internal._disposed) return;
	await Promise.all(ctx.frameGraph._tasks.map((task) => task._preload?.()));
	if (internal._disposed) return;
	ctx.frameGraph.build();
	registerRenderingContext(ctx.surface, ctx);
}
/** Unregister the standalone frame-graph context from its surface. */
function unregisterFrameGraphContext(ctx) {
	unregisterRenderingContext(ctx.surface, ctx);
}
/** Unregister and dispose all GPU resources owned by the standalone frame graph. */
function disposeFrameGraphContext(ctx) {
	const internal = ctx;
	if (internal._disposed) return;
	unregisterFrameGraphContext(ctx);
	ctx.frameGraph.dispose();
	internal._disposed = true;
}
export { createFrameGraphContext, disposeFrameGraphContext, registerFrameGraphContext, registerFrameGraphContextAsync, unregisterFrameGraphContext };

//# sourceMappingURL=frame-graph-context.js.map