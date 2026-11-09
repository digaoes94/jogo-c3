import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
import { runGpuResourceDisposers } from "../engine/gpu-resource-disposal.js";
// src/render/draw-update-batches.ts
/** @internal Batch-producing features install their collection and lifetime behavior on demand. */
function enableDrawBatchCollection(signature) {
	signature._collectBatches = collectBatches;
}
function collectBatches(state, binding) {
	if (!binding._updateBatches?.length) return state;
	if (state?._reset !== resetBatches) state = {
		_batches: state?._batches.slice() ?? [],
		_reset: resetBatches,
		_flush: flushBatches,
		_select: selectBatches,
		_release: releaseBatches
	};
	for (const batch of binding._updateBatches) if (!state._batches.includes(batch)) state._batches.push(batch);
	return state;
}
function resetBatches() {
	for (const batch of this._batches) batch.reset();
}
function flushBatches(engine) {
	for (const batch of this._batches) batch.flush(engine);
}
function selectBatches(lists) {
	let state;
	for (const list of lists) for (const binding of list) state = collectBatches(state, binding);
	return state;
}
function releaseBatches(engine, retained) {
	const removed = this._batches.filter((batch) => !batch._retired && !retained?.some((state) => state?._batches.includes(batch)));
	if (!removed.length) return;
	for (const batch of removed) if (batch._retired !== void 0) batch._retired = true;
	if (engine) retireGpuResources(engine, () => runGpuResourceDisposers(removed));
	else runGpuResourceDisposers(removed);
}
export { enableDrawBatchCollection };

//# sourceMappingURL=draw-update-batches.js.map