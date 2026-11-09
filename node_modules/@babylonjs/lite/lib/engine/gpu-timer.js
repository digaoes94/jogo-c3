// src/engine/gpu-timer.ts
/** Whether a device can measure GPU time — it offered the `timestamp-query` feature (which also enables the
*  standard `timestampWrites` pass attachments this timer uses; no `--enable-unsafe-webgpu` flag required). */
function gpuTimingSupportedFor(device) {
	return device.features.has("timestamp-query");
}
/** Create a GPU frame timer, or null when the device can't support timestamp queries. */
function createGpuFrameTimer(device) {
	if (!gpuTimingSupportedFor(device)) return null;
	return {
		device,
		markerPipeline: device.createComputePipeline({
			layout: "auto",
			compute: {
				module: device.createShaderModule({ code: "@compute @workgroup_size(1) fn main() {}" }),
				entryPoint: "main"
			}
		}),
		querySet: device.createQuerySet({
			type: "timestamp",
			count: 2
		}),
		resolveBuf: device.createBuffer({
			size: 16,
			usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
		}),
		pool: [],
		lastMs: 0,
		inFlight: 0
	};
}
/** Record the opening marker before the frame's passes. */
function gpuFrameTimerBegin(timer, encoder) {
	const pass = encoder.beginComputePass({ timestampWrites: {
		querySet: timer.querySet,
		beginningOfPassWriteIndex: 0
	} });
	pass.setPipeline(timer.markerPipeline);
	pass.dispatchWorkgroups(1);
	pass.end();
}
/** Record the closing marker after the frame's passes, before finish/submit. */
function gpuFrameTimerEnd(timer, encoder) {
	const pass = encoder.beginComputePass({ timestampWrites: {
		querySet: timer.querySet,
		endOfPassWriteIndex: 1
	} });
	pass.setPipeline(timer.markerPipeline);
	pass.dispatchWorkgroups(1);
	pass.end();
}
/** Resolve the just-submitted timestamp pair and update `lastMs` when the readback maps. Submitted as its
*  own tiny command buffer AFTER the frame's submit, so the bracketing timestamps are already written; the
*  recycled MAP_READ buffer is mapped asynchronously, so reading never stalls the frame. */
function gpuFrameTimerResolve(timer) {
	if (timer.inFlight > 3) return;
	const dev = timer.device;
	const rb = timer.pool.pop() ?? dev.createBuffer({
		size: 16,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
	});
	const enc = dev.createCommandEncoder();
	enc.resolveQuerySet(timer.querySet, 0, 2, timer.resolveBuf, 0);
	enc.copyBufferToBuffer(timer.resolveBuf, 0, rb, 0, 16);
	dev.queue.submit([enc.finish()]);
	timer.inFlight++;
	rb.mapAsync(GPUMapMode.READ).then(() => {
		const a = new BigInt64Array(rb.getMappedRange());
		const ms = Number(a[1] - a[0]) / 1e6;
		if (ms >= 0 && ms < 5e3) timer.lastMs = timer.lastMs > 0 ? timer.lastMs * .8 + ms * .2 : ms;
		rb.unmap();
		timer.pool.push(rb);
		timer.inFlight--;
	}, () => {
		timer.inFlight--;
	});
}
/** Release the timer's GPU resources. */
function destroyGpuFrameTimer(timer) {
	timer.querySet.destroy();
	timer.resolveBuf.destroy();
	for (const b of timer.pool) b.destroy();
	timer.pool.length = 0;
}
export { createGpuFrameTimer, destroyGpuFrameTimer, gpuFrameTimerBegin, gpuFrameTimerEnd, gpuFrameTimerResolve, gpuTimingSupportedFor };

//# sourceMappingURL=gpu-timer.js.map