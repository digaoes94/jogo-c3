import { createRampParam, setRampTarget } from "./audio-param.js";
// src/audio/sound-sub-graph.ts
/**
* Per-sound sub-graph.
*
* Faithful port of AudioV2 `_WebAudioBaseSubGraph` + `_WebAudioBusAndSoundSubGraph`
* + `_VolumeWebAudioSubNode`. The volume `GainNode` is always present; the
* spatial, stereo, and analyzer sub-nodes are optional and spliced in on demand
* by their (tree-shaken) feature modules.
*
* Signal flow (mirrors AudioV2 `_onSubNodesChanged`):
* - none: `instances` -\> `_volume` (`_in` === `_out`)
* - spatial OR stereo: `instances` -\> `subNode._inputNode` -\> `_volume`
* - spatial AND stereo: `instances` -\> `_root` (split) -\> [spatial, stereo] -\> `_volume`
* - analyzer (any of the above): `_volume` also fans out to the analyzer tap
*/
/** @internal */
function createSoundSubGraph(ctx, clock, volume = 1) {
	const gain = new GainNode(ctx);
	gain.gain.value = volume;
	return {
		_ctx: ctx,
		_volume: gain,
		_volumeRamp: createRampParam(gain.gain, clock),
		_spatial: null,
		_stereo: null,
		_analyzer: null,
		_root: null,
		_in: gain,
		_out: gain
	};
}
/**
* Recomputes the head node (`_in`) after a pre-volume sub-node (spatial/stereo)
* is added or removed, mirroring AudioV2 `_onSubNodesChanged`. When both spatial
* and stereo are present they run in parallel, fed by a split `_root` gain. Any
* live instances are reconnected from the old head to the new one. @internal
*/
function rebuildSoundSubGraphHead(graph, instances) {
	const spatial = graph._spatial;
	const stereo = graph._stereo;
	let head;
	if (spatial && stereo) {
		const root = graph._root ??= new GainNode(graph._ctx);
		root.disconnect();
		root.connect(spatial._inputNode);
		root.connect(stereo._inputNode);
		head = root;
	} else {
		if (graph._root) {
			graph._root.disconnect();
			graph._root = null;
		}
		head = spatial?._inputNode ?? stereo?._inputNode ?? graph._volume;
	}
	const oldHead = graph._in;
	if (oldHead === head) return;
	graph._in = head;
	if (instances) for (const instance of instances) {
		try {
			instance._volumeNode.disconnect(oldHead);
		} catch {}
		instance._volumeNode.connect(head);
	}
}
/** @internal */
function setSoundSubGraphVolume(graph, value, options) {
	setRampTarget(graph._volumeRamp, value, options);
}
/** Connects the sub-graph output to a downstream input node. @internal */
function connectSoundSubGraph(graph, downstream) {
	graph._out.connect(downstream);
}
/** Disconnects the sub-graph output from a downstream input node. @internal */
function disconnectSoundSubGraph(graph, downstream) {
	graph._out.disconnect(downstream);
}
/** @internal */
function disposeSoundSubGraph(graph) {
	graph._spatial?._dispose();
	graph._spatial = null;
	graph._stereo?._dispose();
	graph._stereo = null;
	graph._analyzer?._dispose();
	graph._analyzer = null;
	graph._root?.disconnect();
	graph._root = null;
	graph._volume.disconnect();
}
export { connectSoundSubGraph, createSoundSubGraph, disconnectSoundSubGraph, disposeSoundSubGraph, rebuildSoundSubGraphHead, setSoundSubGraphVolume };

//# sourceMappingURL=sound-sub-graph.js.map