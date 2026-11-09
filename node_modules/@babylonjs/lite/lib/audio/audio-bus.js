import { setMainBusVolume } from "./bus.js";
import { connectSoundSubGraph, createSoundSubGraph, disposeSoundSubGraph, setSoundSubGraphVolume } from "./sound-sub-graph.js";
// src/audio/audio-bus.ts
/** Narrows a {@link PrimaryAudioBus} to a generic {@link AudioBus}. */
function _isAudioBus(bus) {
	return "_graph" in bus;
}
/** Resolves the Web Audio input node where upstream sounds/buses connect. @internal */
function getBusInputNode(bus) {
	return _isAudioBus(bus) ? bus._graph._in : bus._in;
}
/**
* Creates a generic mixer bus routed to another bus (defaulting to the engine's
* default main bus). Multiple sounds/buses can be routed through a bus to mix
* and control their combined volume.
* @param engine - The audio engine.
* @param name - A name for the bus.
* @param options - Bus options.
* @returns A promise that resolves with the ready bus.
*/
async function createAudioBusAsync(engine, name, options = {}) {
	await engine._isReady;
	const graph = createSoundSubGraph(engine._ctx, engine, options.volume ?? 1);
	const outBus = options.outBus ?? engine._mainBus;
	connectSoundSubGraph(graph, getBusInputNode(outBus));
	const bus = {
		name,
		_engine: engine,
		_graph: graph,
		_outBus: outBus,
		_dispose: () => disposeAudioBus(bus)
	};
	engine._buses.add(bus);
	return bus;
}
/** Sets a bus's output volume, optionally ramping. Works on a generic bus or the main bus. */
function setBusVolume(bus, value, options) {
	if (_isAudioBus(bus)) setSoundSubGraphVolume(bus._graph, value, options);
	else setMainBusVolume(bus, value, options);
}
/** Disposes a generic bus, releasing its sub-graph. */
function disposeAudioBus(bus) {
	disposeSoundSubGraph(bus._graph);
	bus._engine._buses.delete(bus);
}
export { createAudioBusAsync, disposeAudioBus, getBusInputNode, setBusVolume };

//# sourceMappingURL=audio-bus.js.map