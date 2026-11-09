import { createRampParam, setRampTarget } from "./audio-param.js";
// src/audio/bus.ts
/**
* Main output + main bus.
*
* Faithful port of AudioV2 `_WebAudioMainOut` and `_WebAudioMainBus` collapsed
* to pure state + functions. Graph (Phase 1):
*
* `mainBus._volume (GainNode)` -\> `mainOut._gain (GainNode)` -\> `ctx.destination`
*
* Sounds connect their sub-graph output into `mainBus._in`.
*/
/** @internal */
function createMainOut(ctx, clock) {
	const gain = new GainNode(ctx);
	gain.connect(ctx.destination);
	return {
		_gain: gain,
		_volumeRamp: createRampParam(gain.gain, clock)
	};
}
/** @internal */
function setMainOutVolume(mainOut, value, options) {
	setRampTarget(mainOut._volumeRamp, value, options);
}
/** @internal */
function disposeMainOut(mainOut) {
	mainOut._gain.disconnect();
}
/** @internal */
function createMainBus(name, ctx, clock, mainOut) {
	const volume = new GainNode(ctx);
	volume.connect(mainOut._gain);
	return {
		name,
		_volume: volume,
		_volumeRamp: createRampParam(volume.gain, clock),
		_in: volume,
		_out: volume
	};
}
/** @internal */
function setMainBusVolume(bus, value, options) {
	setRampTarget(bus._volumeRamp, value, options);
}
/** @internal */
function disposeMainBus(bus) {
	bus._volume.disconnect();
}
export { createMainBus, createMainOut, disposeMainBus, disposeMainOut, setMainBusVolume, setMainOutVolume };

//# sourceMappingURL=bus.js.map