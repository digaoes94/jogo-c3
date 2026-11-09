import { a as gx, i as V$, n as L1 } from "../_chunks/vendor/text-shaper-BjdYw5JD.js";
// src/text/layout.ts
/** Default LTR + word-wrap + align layout, backed by text-shaper.
*
*  Public surface: `TextLayoutOptions` (the options bag, public) and `layoutText` (the
*  internal implementation; not exported from `src/index.ts`). Callers driving their own
*  layout don't import this module and pay zero bytes for it. */
/** Shaping scratch buffers, reused across every `layoutText` call.
*
*  `shape()` pulls from a pool inside text-shaper that is only refilled by `releaseBuffer()`
*  — which the package does not export — so every `shape()` call allocates a fresh
*  `GlyphBuffer` whose object pools start empty, then allocates one `GlyphInfo` and one
*  `GlyphPosition` per codepoint. Because layout shapes one paragraph per call, a block of
*  N paragraphs pays that N times per frame.
*
*  Holding the buffers here and driving `shapeInto` keeps the pools warm across calls, so
*  after the first block the shaping stage allocates nothing. Retained memory is bounded by
*  the largest chunk ever shaped (see `BATCH_CODEPOINTS`). `layoutText` is synchronous and
*  never re-enters, so a single shared set is safe.
*
*  Lazily initialised: a module-level `new` would be an import-time side effect and would
*  defeat tree-shaking for callers that drive their own layout. */
var scratchInput = null;
var scratchOutput = null;
/** Per-chunk paragraph end clusters; see the batching notes in `layoutText`. */
var scratchEnds = null;
/** Paragraphs shaped per `shapeInto` call once batching is enabled.
*
*  `shapeInto` carries a fixed per-call cost (buffer reset, codepoint init, script detection,
*  GSUB/GPOS driver setup) that is independent of the text length, so shaping one paragraph at
*  a time makes a block of N paragraphs pay it N times. Batching amortises it, but the benefit
*  saturates quickly: measured against an 840-paragraph grid, going from 840 calls to ~26 (this
*  chunk size) recovers essentially the whole win, while halving the call count again lands
*  inside run-to-run noise. Chunking rather than shaping the whole block keeps the window that
*  any cross-paragraph shaping effect could reach small and bounds retained scratch memory. */
var BATCH_PARAGRAPHS = 32;
/** Soft codepoint cap per chunk, so the retained scratch buffers stay bounded when paragraphs
*  are long. Checked before appending, so a chunk may overshoot by its final paragraph. */
var BATCH_CODEPOINTS = 4096;
/** Batching is limited to text whose code units all fall below this.
*
*  Below it lie Latin, Greek, Cyrillic, Armenian, punctuation and symbols — all simple LTR.
*  At and above it begin Hebrew, Arabic, the Indic blocks and the other complex scripts, whose
*  shaping is decided for the buffer as a whole: `shapeInto` samples only the head of the
*  buffer to select complex shaping, and reverses the entire buffer for RTL. Batching those
*  would let one paragraph decide its neighbours' treatment, so they keep one shape call per
*  paragraph.
*
*  The test is on UTF-16 code units, so surrogates (0xD800-0xDFFF) also fall outside and any
*  text beyond the BMP takes the per-paragraph path too. That is intended — astral sequences
*  carry their own shaping rules — and falling back is always correct, only slower. */
var SIMPLE_SCRIPT_LIMIT = 1424;
/** @internal Default LTR + word-wrap + align layout. Returns placed glyphs, the layout scale,
*  and the run's pixel-space bounding size. Caller wraps into a `GlyphRun` with the appropriate `curveSet`. */
function layoutText(font, text, fontSizePx, options) {
	const rawFont = font._font;
	const maxWidth = options?.maxWidth ?? Infinity;
	const lineHeightMult = options?.lineHeight ?? 1.2;
	const textAlign = options?.align ?? "left";
	const letterSpacing = options?.letterSpacing ?? 0;
	const tabSize = options?.tabSize ?? 4;
	const scale = rawFont.scaleForSize(fontSizePx);
	const lineHeightPx = fontSizePx * lineHeightMult;
	const spaceGid = rawFont.glyphId(32);
	const collapsed = text.replace(/\t/g, " ".repeat(tabSize)).replace(/ +/g, " ");
	const paragraphs = collapsed.split("\n");
	const lines = [];
	const lineWidths = [];
	const input = scratchInput ??= new L1();
	const output = scratchOutput ??= new gx();
	const ends = scratchEnds ??= new Int32Array(BATCH_PARAGRAPHS);
	const paraCount = paragraphs.length;
	let batchSize = 1;
	if (paraCount >= 8) {
		batchSize = BATCH_PARAGRAPHS;
		for (let i = 0; i < collapsed.length; i++) if (collapsed.charCodeAt(i) >= SIMPLE_SCRIPT_LIMIT) {
			batchSize = 1;
			break;
		}
	}
	for (let base = 0; base < paraCount;) {
		input.clear();
		let count = 0;
		while (base + count < paraCount && count < batchSize && (count === 0 || input.length < BATCH_CODEPOINTS)) {
			if (count > 0) input.addStr("\n", input.length);
			input.addStr(paragraphs[base + count].trim(), input.length);
			ends[count] = input.length;
			count++;
		}
		V$(rawFont, input, output);
		const infos = output.infos;
		const positions = output.positions;
		const shapedCount = infos.length;
		let gi = 0;
		for (let k = 0; k < count; k++) {
			const clusterEnd = ends[k];
			const clusterStart = k === 0 ? 0 : ends[k - 1] + 1;
			while (gi < shapedCount && infos[gi].cluster < clusterStart) gi++;
			const paraStart = gi;
			while (gi < shapedCount && infos[gi].cluster < clusterEnd) gi++;
			const paraEnd = gi;
			if (paraStart === paraEnd) {
				lines.push([]);
				lineWidths.push(0);
				continue;
			}
			let currentLine = [];
			let lineCursorX = 0;
			let i = paraStart;
			while (i < paraEnd) {
				while (i < paraEnd && infos[i].codepoint === 32) {
					const pos = positions[i];
					const xAdvance = pos.xAdvance + letterSpacing;
					currentLine.push({
						_glyphId: infos[i].glyphId,
						_x: lineCursorX,
						_line: lines.length,
						_xAdvance: xAdvance,
						_xOffset: pos.xOffset,
						_yOffset: pos.yOffset
					});
					lineCursorX += xAdvance * scale;
					i++;
				}
				const wordStart = i;
				let wordWidth = 0;
				while (i < paraEnd && infos[i].codepoint !== 32) {
					wordWidth += (positions[i].xAdvance + letterSpacing) * scale;
					i++;
				}
				const wordEnd = i;
				if (lineCursorX + wordWidth > maxWidth && currentLine.length > 0) {
					while (currentLine.length > 0 && currentLine[currentLine.length - 1]._glyphId === spaceGid) currentLine.pop();
					const last = currentLine[currentLine.length - 1];
					const lw = last ? last._x + last._xAdvance * scale : 0;
					lines.push(currentLine);
					lineWidths.push(lw);
					currentLine = [];
					lineCursorX = 0;
				}
				for (let w = wordStart; w < wordEnd; w++) {
					const pos = positions[w];
					const xAdvance = pos.xAdvance + letterSpacing;
					currentLine.push({
						_glyphId: infos[w].glyphId,
						_x: lineCursorX,
						_line: lines.length,
						_xAdvance: xAdvance,
						_xOffset: pos.xOffset,
						_yOffset: pos.yOffset
					});
					lineCursorX += xAdvance * scale;
				}
			}
			if (currentLine.length > 0) {
				lines.push(currentLine);
				lineWidths.push(lineCursorX);
			}
		}
		base += count;
	}
	let totalWidth = 0;
	for (const w of lineWidths) if (w > totalWidth) totalWidth = w;
	const totalHeight = lines.length * lineHeightPx;
	const placed = [];
	for (let li = 0; li < lines.length; li++) {
		const line = lines[li];
		const lw = lineWidths[li];
		let alignOffset = 0;
		if (textAlign === "center") alignOffset = (totalWidth - lw) * .5;
		else if (textAlign === "right") alignOffset = totalWidth - lw;
		const lineY = -li * lineHeightPx;
		for (const g of line) placed.push({
			glyphId: g._glyphId,
			x: g._x + alignOffset + g._xOffset * scale,
			y: lineY + g._yOffset * scale
		});
	}
	return {
		_glyphs: placed,
		_pixelsPerFontUnit: scale,
		_width: totalWidth,
		_height: totalHeight
	};
}
export { layoutText };

//# sourceMappingURL=layout.js.map