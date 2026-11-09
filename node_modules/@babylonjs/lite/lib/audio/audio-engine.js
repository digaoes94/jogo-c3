import { createMainBus, createMainOut, disposeMainBus, disposeMainOut, setMainOutVolume } from "./bus.js";
import { createAudioSignal } from "./audio-signal.js";
// src/audio/audio-engine.ts
/**
* Audio engine — lifecycle, master output, default main bus, autoplay unlock.
*
* Faithful port of AudioV2 `_WebAudioEngine` + `CreateAudioEngineAsync`,
* re-shaped to pure state + standalone functions. Re-architected per Babylon
* Lite pillars:
*   - No module-level side effects (no `Instances[]`, no module-scope Observable).
*   - Caller owns the engine handle (no `LastCreatedAudioEngine`).
*   - `Observable` becomes `AudioSignal`.
*   - Global hooks (click listener, resume timer) are registered into
*     `engine._disposers` and torn down on dispose.
*   - `OfflineAudioContext` is fully supported for deterministic, headless
*     PCM rendering (the primary audio test gate).
*/
var FormatMimeTypes = {
	aac: "audio/aac",
	ac3: "audio/ac3",
	flac: "audio/flac",
	m4a: "audio/mp4",
	mp3: "audio/mpeg; codecs=\"mp3\"",
	mp4: "audio/mp4",
	ogg: "audio/ogg; codecs=\"vorbis\"",
	wav: "audio/wav",
	webm: "audio/webm; codecs=\"vorbis\""
};
function isOfflineContext(ctx) {
	return typeof OfflineAudioContext !== "undefined" && ctx instanceof OfflineAudioContext;
}
/**
* Creates and initializes an audio engine.
* @param options - Engine options.
* @returns A promise that resolves with the ready-to-use engine.
*/
async function createAudioEngineAsync(options = {}) {
	const ctx = options.audioContext ?? new AudioContext();
	const isOffline = isOfflineContext(ctx);
	const onStateChanged = createAudioSignal();
	const onUserGesture = createAudioSignal();
	let resolveReady;
	const isReady = new Promise((resolve) => {
		resolveReady = resolve;
	});
	const engine = {
		get state() {
			return isOffline ? "running" : ctx.state;
		},
		get audioContext() {
			return ctx;
		},
		get currentTime() {
			return ctx.currentTime ?? 0;
		},
		get _currentTime() {
			return ctx.currentTime ?? 0;
		},
		get onStateChanged() {
			return onStateChanged;
		},
		get onUserGesture() {
			return onUserGesture;
		},
		_ctx: ctx,
		_isOffline: isOffline,
		_rampDuration: typeof options.parameterRampDuration === "number" ? Math.max(0, options.parameterRampDuration) : .01,
		_volume: options.volume ?? 1,
		_mainOut: void 0,
		_mainBus: void 0,
		_validFormats: /* @__PURE__ */ new Set(),
		_invalidFormats: /* @__PURE__ */ new Set(),
		_sounds: /* @__PURE__ */ new Set(),
		_buses: /* @__PURE__ */ new Set(),
		_listener: null,
		_spatialUpdaters: /* @__PURE__ */ new Set(),
		_spatialAutoStop: null,
		_disposers: [],
		_onStateChanged: onStateChanged,
		_onUserGesture: onUserGesture,
		_isReady: isReady
	};
	engine._mainOut = createMainOut(ctx, engine);
	setMainOutVolume(engine._mainOut, engine._volume);
	engine._mainBus = createMainBus("default", ctx, engine, engine._mainOut);
	_wireStateAndResume(engine, options);
	_wireUserGesture(engine, options);
	resolveReady();
	await isReady;
	return engine;
}
function _wireStateAndResume(engine, options) {
	const ctx = engine._ctx;
	if (engine._isOffline || typeof ctx.addEventListener !== "function") return;
	const resumeOnPause = options.resumeOnPause !== false;
	const retryInterval = options.resumeOnPauseRetryInterval ?? 1e3;
	let started = false;
	let resumeTimer = null;
	const clearResumeTimer = () => {
		if (resumeTimer !== null) {
			clearInterval(resumeTimer);
			resumeTimer = null;
		}
	};
	const onStateChange = () => {
		const state = engine.state;
		if (state === "running") {
			clearResumeTimer();
			started = true;
		} else if ((state === "suspended" || state === "interrupted") && started && resumeOnPause) {
			clearResumeTimer();
			resumeTimer = setInterval(() => {
				ctx.resume();
			}, retryInterval);
		}
		engine._onStateChanged._notify(state);
	};
	ctx.addEventListener("statechange", onStateChange);
	engine._disposers.push(() => {
		clearResumeTimer();
		ctx.removeEventListener("statechange", onStateChange);
	});
}
function _wireUserGesture(engine, options) {
	const resumeOnInteraction = options.resumeOnInteraction !== false;
	if (engine._isOffline || typeof document === "undefined" || typeof document.addEventListener !== "function") return;
	const onGesture = () => {
		if (resumeOnInteraction) engine._ctx.resume();
		engine._onUserGesture._notify();
	};
	document.addEventListener("click", onGesture);
	engine._disposers.push(() => document.removeEventListener("click", onGesture));
}
/**
* Unlocks (resumes) the audio engine. Browsers require a user gesture before a
* real-time context can produce sound; call this from a click/tap handler.
* @param engine - The audio engine.
*/
async function unlockAudioEngineAsync(engine) {
	if (engine._isOffline) return;
	const ctx = engine._ctx;
	if (ctx.state !== "running") await ctx.resume();
}
/**
* Sets the master output volume, optionally ramping to the new value.
* @param engine - The audio engine.
* @param value - Target volume (1 = unchanged).
* @param options - Optional ramp shape/duration.
*/
function setMasterVolume(engine, value, options) {
	engine._volume = value;
	setMainOutVolume(engine._mainOut, value, options);
}
/** The master output volume. */
function getMasterVolume(engine) {
	return engine._volume;
}
/**
* Whether the given audio file format/extension can be decoded by the browser.
* In non-browser (offline render / test) environments where no `Audio` element
* exists, the format is assumed valid.
* @internal
*/
function isAudioFormatValid(engine, format) {
	if (engine._validFormats.has(format)) return true;
	if (engine._invalidFormats.has(format)) return false;
	const mimeType = FormatMimeTypes[format];
	if (mimeType === void 0) return false;
	if (typeof Audio === "undefined") return true;
	if (new Audio().canPlayType(mimeType) === "") {
		engine._invalidFormats.add(format);
		return false;
	}
	engine._validFormats.add(format);
	return true;
}
/**
* Disposes the audio engine: stops all sounds, tears down global hooks, and
* closes the (non-offline) audio context.
* @param engine - The audio engine to dispose.
*/
function disposeAudioEngine(engine) {
	engine._spatialAutoStop?.();
	engine._spatialAutoStop = null;
	engine._spatialUpdaters.clear();
	engine._listener?._dispose();
	for (const sound of Array.from(engine._sounds)) sound._dispose();
	engine._sounds.clear();
	for (const bus of Array.from(engine._buses)) bus._dispose();
	engine._buses.clear();
	for (const dispose of engine._disposers) try {
		dispose();
	} catch (e) {
		console.warn(`Audio disposer failed: ${e.message}`);
	}
	engine._disposers.length = 0;
	disposeMainBus(engine._mainBus);
	disposeMainOut(engine._mainOut);
	const ctx = engine._ctx;
	if (!engine._isOffline && ctx.state !== "closed") ctx.close();
	engine._onStateChanged._clear();
	engine._onUserGesture._clear();
}
export { createAudioEngineAsync, disposeAudioEngine, getMasterVolume, isAudioFormatValid, setMasterVolume, unlockAudioEngineAsync };

//# sourceMappingURL=audio-engine.js.map