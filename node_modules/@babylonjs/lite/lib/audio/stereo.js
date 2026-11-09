import { createRampParam, setRampTarget } from "./audio-param.js";
import { rebuildSoundSubGraphHead } from "./sound-sub-graph.js";
// src/audio/stereo.ts
/** Default stereo pan: centered. */
var DEFAULT_PAN = 0;
function createStereoSubNode(engine) {
	const node = new StereoPannerNode(engine._ctx);
	node.pan.value = DEFAULT_PAN;
	return {
		_engine: engine,
		_inputNode: node,
		_pan: createRampParam(node.pan, engine),
		_dispose: () => {
			node.disconnect();
		}
	};
}
/**
* Lazily build the stereo sub-node and splice it into the host's sub-graph,
* reconnecting any live instances. Idempotent.
*/
function ensureStereoSubNode(host) {
	const graph = host._graph;
	if (graph._stereo) return graph._stereo;
	const node = createStereoSubNode(host._engine);
	node._inputNode.connect(graph._volume);
	graph._stereo = node;
	rebuildSoundSubGraphHead(graph, host._instances);
	return node;
}
/**
* Enables (or reconfigures) stereo panning on a sound or bus, building the
* stereo sub-node on first use. Pulls the stereo module only when called.
* @param host - A `StaticSound`, `StreamingSound`, or `AudioBus`.
* @param options - Stereo options (pan).
*/
function enableStereo(host, options = {}) {
	const node = ensureStereoSubNode(host);
	if (options.pan !== void 0) setRampTarget(node._pan, options.pan);
}
/**
* Sets the stereo pan of a sound or bus, building the stereo sub-node on first
* use.
* @param host - A `StaticSound`, `StreamingSound`, or `AudioBus`.
* @param pan - Pan in the range `[-1, 1]` (`-1` = full left, `1` = full right).
* @param options - Optional ramp options for a smooth transition.
*/
function setStereoPan(host, pan, options) {
	const node = ensureStereoSubNode(host);
	setRampTarget(node._pan, pan, options);
}
export { enableStereo, setStereoPan };

//# sourceMappingURL=stereo.js.map