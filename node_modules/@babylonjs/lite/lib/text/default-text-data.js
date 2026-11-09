import { r as RW } from "../_chunks/vendor/text-shaper-BjdYw5JD.js";
import { extractGlyphCurves } from "./glyph-extraction.js";
import { createGlyphStorage, disposeGlyphStorage, updateGlyphStorage } from "./glyph-storage.js";
import { createTextData, disposeTextData, updateTextData } from "./text-data.js";
import { layoutText } from "./layout.js";
// src/text/default-text-data.ts
/** Mark every glyph in `glyphs` as seen, returning only the ids not seen before, or `null`
*  when there are none.
*
*  Re-shaped text almost always reuses the repertoire it already had — an 840-cell grid of
*  changing numbers is ~37 distinct glyphs across 5,466 placements — so the common answer is
*  "nothing new". Answering that with a typed-array probe per glyph keeps the steady state
*  allocation free and lets the caller skip extraction and storage update entirely. That
*  matters more than it looks: `extractGlyphCurves` only early-outs on ids already in the
*  target map, so passing it a fresh map every call made it re-walk the whole repertoire, and
*  glyphs with no outline (space) were re-extracted forever because an absent outline is
*  never cached.
*
*  A glyph id at or beyond `seen.length` reads `undefined`, which is not `=== 0`, so it is
*  treated as already seen and never reaches extraction. That matches the old behaviour
*  observably: `extractGlyphCurves` asks `extractOne` for such an id, gets `null`, and skips
*  it without recording anything. */
function collectNewGlyphs(seen, glyphs) {
	let added = null;
	for (const g of glyphs) {
		const id = g.glyphId;
		if (seen[id] === 0) {
			seen[id] = 1;
			(added ??= /* @__PURE__ */ new Set()).add(id);
		}
	}
	return added;
}
/** Derive the curve-set id from the font's family name (e.g. "Inter", "Roboto"). Falls back
*  to `"font"` for fonts that lack a usable name table. */
function familyCurveSetId(font) {
	return font._font.name && RW(font._font.name) || "font";
}
/** Shape `text` with the default layout, extract glyph curves, and bundle into a
*  `DefaultTextData`. `textColor` is applied as the run's defaultColor (per-glyph color
*  overrides remain available via direct `updateTextData(replaceRun)` calls).
*
*  The returned `DefaultTextData` owns its underlying `GlyphStorage` — release both with
*  `disposeDefaultTextData(data)`. */
function createDefaultTextData(font, fontSizePx, text, textColor, options) {
	const laid = layoutText(font, text, fontSizePx, options);
	const innerCurves = /* @__PURE__ */ new Map();
	const seenGlyphs = new Uint8Array(font._font.numGlyphs);
	const ids = collectNewGlyphs(seenGlyphs, laid._glyphs);
	if (ids) extractGlyphCurves(font, ids, innerCurves);
	const curveSetId = familyCurveSetId(font);
	const storage = createGlyphStorage(/* @__PURE__ */ new Map([[curveSetId, innerCurves]]));
	const run = {
		curveSet: curveSetId,
		glyphs: laid._glyphs,
		pixelsPerFontUnit: laid._pixelsPerFontUnit,
		defaultColor: textColor
	};
	return Object.assign(createTextData(storage, [run]), {
		width: laid._width,
		height: laid._height,
		_font: font,
		_fontSizePx: fontSizePx,
		_options: options,
		_curveSetId: curveSetId,
		_storage: storage,
		_seenGlyphs: seenGlyphs
	});
}
/** Re-shape `text` and apply the new run via `updateTextData(replaceRun)`. New glyphs are
*  added to the storage in place. When `textColor` is omitted, the live run's existing
*  `defaultColor` is preserved (so any caller-driven color override survives a text re-shape). */
function updateDefaultTextData(data, text, textColor) {
	const laid = layoutText(data._font, text, data._fontSizePx, data._options);
	const ids = collectNewGlyphs(data._seenGlyphs, laid._glyphs);
	if (ids) {
		const innerCurves = /* @__PURE__ */ new Map();
		extractGlyphCurves(data._font, ids, innerCurves);
		updateGlyphStorage(data._storage, data._curveSetId, innerCurves);
	}
	const previousRun = data.runs[0];
	const newRun = {
		curveSet: data._curveSetId,
		glyphs: laid._glyphs,
		pixelsPerFontUnit: laid._pixelsPerFontUnit,
		defaultColor: textColor ?? previousRun.defaultColor
	};
	updateTextData(data, {
		update: "replaceRun",
		previous: previousRun,
		run: newRun
	});
	Object.assign(data, {
		width: laid._width,
		height: laid._height
	});
}
/** Release the per-block GPU resources AND the underlying `GlyphStorage` owned by `data`. */
function disposeDefaultTextData(data) {
	disposeTextData(data);
	disposeGlyphStorage(data._storage);
}
export { createDefaultTextData, disposeDefaultTextData, updateDefaultTextData };

//# sourceMappingURL=default-text-data.js.map