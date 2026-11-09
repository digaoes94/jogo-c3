import { connectSoundSubGraph, createSoundSubGraph, disposeSoundSubGraph, setSoundSubGraphVolume } from "./sound-sub-graph.js";
import { getBusInputNode } from "./audio-bus.js";
// src/audio/sound-source.ts
/**
* Wraps an arbitrary Web Audio node as a sound source, routed to the given
* output bus (or the engine's default main bus).
* @param engine - The audio engine.
* @param node - The input node to wrap (its output is routed through the graph).
* @param options - Source options.
* @returns A promise that resolves with the ready source.
*/
async function createSoundSourceAsync(engine, node, options = {}) {
	const graph = createSoundSubGraph(engine._ctx, engine, options.volume ?? 1);
	let outBus = null;
	if (options.outBus) outBus = options.outBus;
	else if (options.outBusAutoDefault !== false) outBus = engine._mainBus;
	if (outBus) connectSoundSubGraph(graph, getBusInputNode(outBus));
	node.connect(graph._in);
	const source = {
		name: options.name ?? "",
		_engine: engine,
		_node: node,
		_graph: graph,
		_outBus: outBus,
		_instances: /* @__PURE__ */ new Set([{ _volumeNode: node }]),
		_dispose: () => disposeSoundSource(source)
	};
	engine._sounds.add(source);
	return source;
}
/**
* Requests microphone access and wraps the resulting stream as a sound source.
* The source does not auto-connect to the main bus by default (to avoid
* feedback); attach an analyzer or set an `outBus` to use it.
* @param engine - The audio engine.
* @param options - Source options.
* @returns A promise that resolves with the ready microphone source.
* @throws If microphone access is denied or unavailable.
*/
async function createMicrophoneSoundSourceAsync(engine, options = {}) {
	let mediaStream;
	try {
		mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
	} catch (e) {
		throw new Error("Unable to access microphone: " + String(e), { cause: e });
	}
	return createSoundSourceAsync(engine, new MediaStreamAudioSourceNode(engine._ctx, { mediaStream }), {
		outBusAutoDefault: false,
		...options
	});
}
/**
* Sets the source volume, optionally ramping.
* @param source - The sound source.
* @param value - Linear gain (`1` = unity).
* @param options - Optional ramp options.
*/
function setSoundSourceVolume(source, value, options) {
	setSoundSubGraphVolume(source._graph, value, options);
}
/**
* Disposes a sound source, stopping any microphone tracks and releasing its
* graph.
* @param source - The sound source.
*/
function disposeSoundSource(source) {
	const node = source._node;
	if (node) {
		if (typeof MediaStreamAudioSourceNode !== "undefined" && node instanceof MediaStreamAudioSourceNode) for (const track of node.mediaStream.getTracks()) track.stop();
		node.disconnect();
		source._node = null;
	}
	disposeSoundSubGraph(source._graph);
	source._engine._sounds.delete(source);
}
export { createMicrophoneSoundSourceAsync, createSoundSourceAsync, disposeSoundSource, setSoundSourceVolume };

//# sourceMappingURL=sound-source.js.map