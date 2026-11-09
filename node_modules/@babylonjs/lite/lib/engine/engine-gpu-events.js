// src/engine/engine-gpu-events.ts
function attach(engine) {
	const events = engine._gpuEvents;
	const device = engine._device;
	if (events._device === device) return;
	events._device?.removeEventListener("uncapturederror", events._onError);
	events._device = device;
	device.addEventListener("uncapturederror", events._onError);
	device.lost.then((info) => {
		if (events._device !== device) return;
		for (const callback of events._lost) callback(info);
	});
}
function eventsFor(engine) {
	let events = engine._gpuEvents;
	if (!events) {
		const errors = /* @__PURE__ */ new Set();
		events = engine._gpuEvents = {
			_errors: errors,
			_lost: /* @__PURE__ */ new Set(),
			_device: null,
			_onError: (event) => {
				const error = event.error;
				for (const callback of errors) callback(error);
			}
		};
		engine._attachGpuEvents = attach;
	}
	attach(engine);
	return events;
}
/**
* Subscribe to GPU errors that no error scope caught on the engine's device, and on any device that
* device-lost recovery installs later. WebGPU otherwise only logs them, and a broken pipeline renders
* nothing without failing. Returns the unsubscribe function.
*/
function onEngineGpuError(engine, callback) {
	const events = eventsFor(engine);
	events._errors.add(callback);
	return () => {
		events._errors.delete(callback);
	};
}
/**
* Subscribe to the loss of the engine's device, whether or not device-lost recovery is enabled; with recovery,
* the callback runs once per lost device, before the replacement is requested. Returns the unsubscribe function.
*/
function onEngineDeviceLost(engine, callback) {
	const events = eventsFor(engine);
	events._lost.add(callback);
	return () => {
		events._lost.delete(callback);
	};
}
/** The limits of the engine's current device, for sizing buffers, arrays and dispatches. Read-only information. */
function getEngineLimits(engine) {
	return engine._device.limits;
}
/** Whether the engine's current device enabled an optional WebGPU feature (see `createEngineWithFeatures`). */
function hasEngineFeature(engine, feature) {
	return engine._device.features.has(feature);
}
export { getEngineLimits, hasEngineFeature, onEngineDeviceLost, onEngineGpuError };

//# sourceMappingURL=engine-gpu-events.js.map