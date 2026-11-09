// src/engine/gpu-task-timing.ts
/** Whether per-render-task GPU timing can run on this engine's WebGPU device. */
function isRenderTaskGpuTimingSupported(engine) {
	return engine._device.features.has("timestamp-query");
}
/** Return the latest task GPU timing snapshot without stalling the GPU or CPU. */
function getRenderTaskGpuTimings(engine) {
	if (!isRenderTaskGpuTimingSupported(engine)) return makeTimingSnapshot("unsupported", false, false, 0, [], 0, 0);
	const snapshot = engine._gpuTaskTimingResult;
	if (snapshot) return snapshot;
	if (engine._gpuTaskTimerWanted) return makeTimingSnapshot("pending", true, true, 0, [], 0, 0);
	return makeTimingSnapshot("disabled", true, false, 0, [], 0, 0);
}
/** Enable or disable per-frame-graph-task GPU timing.
*
* The profiling implementation is loaded with a dynamic import on first enable. Engines that never call this
* function do not fetch the profiler chunk or carry task-timing code in the always-fetched frame graph.
* The returned snapshot is `unsupported` if the device lacks WebGPU `timestamp-query`, `pending` immediately
* after enable, and `available` once a later frame's async timestamp readback completes.
*/
async function setRenderTaskGpuTimingEnabled(engine, enabled) {
	if (!enabled) {
		engine._gpuTaskTimerEpoch = (engine._gpuTaskTimerEpoch ?? 0) + 1;
		engine._gpuTaskTimerWanted = false;
		engine._gpuTaskTimerDisable?.();
		engine._gpuTaskTimerDisable = void 0;
		engine._gpuTaskTimer = void 0;
		const supported = isRenderTaskGpuTimingSupported(engine);
		engine._gpuTaskTimingResult = makeTimingSnapshot(supported ? "disabled" : "unsupported", supported, false, 0, [], 0, 0);
		return engine._gpuTaskTimingResult;
	}
	if (!isRenderTaskGpuTimingSupported(engine)) {
		engine._gpuTaskTimerWanted = false;
		engine._gpuTaskTimingResult = makeTimingSnapshot("unsupported", false, false, 0, [], 0, 0);
		return engine._gpuTaskTimingResult;
	}
	if (engine._gpuTaskTimerWanted) return getRenderTaskGpuTimings(engine);
	const epoch = (engine._gpuTaskTimerEpoch ?? 0) + 1;
	engine._gpuTaskTimerEpoch = epoch;
	engine._gpuTaskTimerWanted = true;
	engine._gpuTaskTimingResult = makeTimingSnapshot("pending", true, true, 0, [], 0, 0);
	const { createGpuTaskTimer, installGpuTaskTimer } = await import("./gpu-task-timer.js");
	if (!engine._gpuTaskTimerWanted || engine._gpuTaskTimerEpoch !== epoch) return getRenderTaskGpuTimings(engine);
	if (engine._gpuTaskTimer === void 0) engine._gpuTaskTimer = createGpuTaskTimer(engine._device);
	const timer = engine._gpuTaskTimer;
	if (!timer) {
		engine._gpuTaskTimerWanted = false;
		engine._gpuTaskTimingResult = makeTimingSnapshot("unsupported", false, false, 0, [], 0, 0);
		return engine._gpuTaskTimingResult;
	}
	engine._gpuTaskTimerDisable = installGpuTaskTimer(timer, engine, (snapshot) => {
		if (engine._gpuTaskTimerWanted && engine._gpuTaskTimerEpoch === epoch) engine._gpuTaskTimingResult = snapshot;
	});
	return getRenderTaskGpuTimings(engine);
}
/**
* Measure the GPU cost of `task`'s overdraw. The task must have rendered at
* least once (bindings and scene bind group built). `repeats` defaults to 9.
*
* The diagnostic implementation is loaded only when the probe is called, so
* scenes that do not opt in retain no probe runtime code.
*/
async function measureRenderTaskOverdrawCost(engine, task, options) {
	const { _measureRenderTaskOverdrawCost } = await import("../frame-graph/overdraw-probe-run.js");
	return _measureRenderTaskOverdrawCost(engine, task, options);
}
/** @internal */
function makeTimingSnapshot(status, supported, enabled, frameIndex, tasks, droppedTaskCount, totalDurationMs, error) {
	return {
		status,
		supported,
		enabled,
		frameIndex,
		tasks,
		totalDurationMs,
		droppedTaskCount,
		error
	};
}
export { getRenderTaskGpuTimings, isRenderTaskGpuTimingSupported, makeTimingSnapshot, measureRenderTaskOverdrawCost, setRenderTaskGpuTimingEnabled };

//# sourceMappingURL=gpu-task-timing.js.map