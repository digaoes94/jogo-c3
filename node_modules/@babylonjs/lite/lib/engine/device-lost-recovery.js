// src/engine/device-lost-recovery.ts
function getState(engine) {
	return engine._deviceLostRecovery ??= {
		_forceNextLoss: false,
		_requiredFeatures: [],
		_armedDevice: null,
		_registrations: [],
		_samplerDescriptors: /* @__PURE__ */ new WeakMap(),
		_captureRefs: 0,
		_meshCaptureRefs: 0,
		_textures: /* @__PURE__ */ new Set(),
		_texturesPruneAt: 64
	};
}
/** @internal Enable the shared device/surface coordinator and register one context recovery strategy. */
function _enableDeviceLostRecovery(engine, registration) {
	const state = getState(engine);
	const registrations = state._registrations;
	if (registrations.length === 0) state._requiredFeatures = Array.from(engine._device.features);
	if (!registrations.some((current) => current._kind === registration._kind)) registration._enable?.(engine);
	registrations.push(registration);
	arm(engine, state);
	let disabled = false;
	return { disable() {
		if (disabled) return;
		disabled = true;
		const index = registrations.indexOf(registration);
		if (index >= 0) registrations.splice(index, 1);
		if (!registrations.some((current) => current._kind === registration._kind)) registration._disable?.(engine);
	} };
}
/** @internal Mark a deliberate `GPUDevice.destroy()` as a loss that should be recovered. */
function markNextDeviceLossForRecovery(engine) {
	const state = engine._deviceLostRecovery;
	return !!state?._registrations.length && (state._forceNextLoss = true);
}
function arm(engine, state) {
	const device = engine._device;
	if (state._armedDevice === device || state._recovering) return;
	state._armedDevice = device;
	device.lost.then((info) => {
		if (state._registrations.length === 0 || state._armedDevice !== device) return;
		if (info.reason === "destroyed" && !state._forceNextLoss) return;
		state._forceNextLoss = false;
		state._recovering = true;
		const registrations = [...state._registrations];
		for (const registration of registrations) registration._onLost?.(info);
		import("./device-lost-recovery-run.js").then(({ runDeviceLostRecovery }) => runDeviceLostRecovery(engine, state, registrations)).then(() => {
			state._recovering = false;
			arm(engine, state);
			for (const registration of registrations) registration._onRecovered?.();
		}, (error) => {
			state._recovering = false;
			for (const registration of registrations) registration._onRecoveryFailed?.(error);
		});
	});
}
export { _enableDeviceLostRecovery, markNextDeviceLossForRecovery };

//# sourceMappingURL=device-lost-recovery.js.map