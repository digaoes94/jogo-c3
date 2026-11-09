// src/audio/analyzer.ts
/** Default analyzer settings (match AudioV2 / Web Audio defaults). */
var Defaults = {
	fftSize: 2048,
	minDecibels: -100,
	maxDecibels: -30,
	smoothing: .8
};
function applyAnalyzerOptions(node, options) {
	if (options.fftSize !== void 0) node.fftSize = options.fftSize;
	if (options.minDecibels !== void 0) node.minDecibels = options.minDecibels;
	if (options.maxDecibels !== void 0) node.maxDecibels = options.maxDecibels;
	if (options.smoothing !== void 0) node.smoothingTimeConstant = options.smoothing;
}
function createAnalyzerSubNode(engine, options) {
	const node = new AnalyserNode(engine._ctx);
	node.fftSize = Defaults.fftSize;
	node.minDecibels = Defaults.minDecibels;
	node.maxDecibels = Defaults.maxDecibels;
	node.smoothingTimeConstant = Defaults.smoothing;
	applyAnalyzerOptions(node, options);
	return {
		_engine: engine,
		_node: node,
		_dispose: () => {
			node.disconnect();
		}
	};
}
/**
* Lazily build the analyzer tap and attach it to the host's volume output.
* Idempotent; re-applies any supplied options to an existing analyzer.
*/
function ensureAnalyzerSubNode(host, options = {}) {
	const graph = host._graph;
	if (graph._analyzer) {
		const existing = graph._analyzer;
		applyAnalyzerOptions(existing._node, options);
		return existing;
	}
	const node = createAnalyzerSubNode(host._engine, options);
	graph._volume.connect(node._node);
	graph._analyzer = node;
	return node;
}
/**
* Enables (or reconfigures) frequency/amplitude analysis on a sound or bus,
* building the analyzer tap on first use. Pulls the analyzer module only when
* called.
* @param host - A `StaticSound`, `StreamingSound`, or `AudioBus`.
* @param options - Analyzer options (fftSize, dB range, smoothing).
*/
function enableAnalyzer(host, options = {}) {
	ensureAnalyzerSubNode(host, options);
}
/**
* Writes the current frequency-domain data as unsigned bytes into `out`,
* building the analyzer tap on first use. `out` should be sized to the
* analyzer's `frequencyBinCount` (`fftSize / 2`).
* @param host - A `StaticSound`, `StreamingSound`, or `AudioBus`.
* @param out - Destination buffer; values are written in place.
*/
function getByteFrequencyData(host, out) {
	ensureAnalyzerSubNode(host)._node.getByteFrequencyData(out);
}
/**
* Writes the current frequency-domain data as floats (in dBFS) into `out`,
* building the analyzer tap on first use. `out` should be sized to the
* analyzer's `frequencyBinCount` (`fftSize / 2`).
* @param host - A `StaticSound`, `StreamingSound`, or `AudioBus`.
* @param out - Destination buffer; values are written in place.
*/
function getFloatFrequencyData(host, out) {
	ensureAnalyzerSubNode(host)._node.getFloatFrequencyData(out);
}
/**
* Writes the current time-domain (waveform) data as unsigned bytes into `out`,
* building the analyzer tap on first use. Each sample is centered on `128`.
* `out` should be sized to the analyzer's `fftSize`.
* @param host - A `StaticSound`, `StreamingSound`, or `AudioBus`.
* @param out - Destination buffer; values are written in place.
*/
function getByteTimeDomainData(host, out) {
	ensureAnalyzerSubNode(host)._node.getByteTimeDomainData(out);
}
/**
* Writes the current time-domain (waveform) data as floats in `[-1, 1]` into
* `out`, building the analyzer tap on first use. `out` should be sized to the
* analyzer's `fftSize`.
* @param host - A `StaticSound`, `StreamingSound`, or `AudioBus`.
* @param out - Destination buffer; values are written in place.
*/
function getFloatTimeDomainData(host, out) {
	ensureAnalyzerSubNode(host)._node.getFloatTimeDomainData(out);
}
export { enableAnalyzer, getByteFrequencyData, getByteTimeDomainData, getFloatFrequencyData, getFloatTimeDomainData };

//# sourceMappingURL=analyzer.js.map