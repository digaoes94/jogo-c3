import { _installTextStyleSeam, _resolveRunRef, updateTextData } from "./text-data.js";
import { composeSlugShader } from "./shaders/slug-shader.js";
import { _installTextVariantResolver } from "./_gpu/text-pipeline.js";
import { WEIGHT_SHADER_FRAGMENT } from "./shaders/weight-shader-fragment.js";
// src/text/set-font-weight-offset.ts
/** Maximum weight offset in font design units. Values outside 0–100 are clamped. */
var MAX_WEIGHT_OFFSET = 100;
var _offsets = null;
/** Interned per-curve-set draw-group keys for weighted runs. Objects, so a key can never
*  `===` a `CurveSetId` string — a curve set whose id looks like another group's variant key
*  cannot collide, which a delimited composite string key could not guarantee. */
var _keys = null;
/** Composed + compiled module pair per device. A `WeakMap` keyed by `GPUDevice` both scopes
*  the modules to their device and auto-invalidates on device change. */
var _variants = null;
/** Style parameter for a run: its weight offset, or 0. Packed into `TextStyle.params.y`.
*  Reads through the nullable map rather than creating it, so a query — including the
*  setter's own no-op check — allocates nothing. */
function runOffset(run) {
	return _offsets?.get(run) ?? 0;
}
/** Draw-group key: the run's own curve set when unweighted (so unweighted text groups and
*  batches exactly as it did before the feature existed), the interned token otherwise. */
function runGroupKey(run) {
	if (runOffset(run) === 0) return run.curveSet;
	const keys = _keys ??= /* @__PURE__ */ new Map();
	let key = keys.get(run.curveSet);
	if (!key) {
		key = {};
		keys.set(run.curveSet, key);
	}
	return key;
}
/** Compose and compile the weighted Slug shader for a device, once. The base template is
*  shared — this adds only the fragment's incremental WGSL. */
function variantForDevice(device) {
	const variants = _variants ??= /* @__PURE__ */ new WeakMap();
	let variant = variants.get(device);
	if (!variant) {
		const composed = composeSlugShader(WEIGHT_SHADER_FRAGMENT);
		variant = {
			_id: composed._key,
			_vertModule: device.createShaderModule({
				label: "text-vert-" + composed._key,
				code: composed._vert
			}),
			_fragModule: device.createShaderModule({
				label: "text-frag-" + composed._key,
				code: composed._frag
			})
		};
		variants.set(device, variant);
	}
	return variant;
}
/** Set the synthetic font-weight contour offset (in font design units) of one run of `data`.
*
*  This mutates live text data, like a setter on a material: the run is repacked and
*  regrouped before the call returns, so it is valid at any point in the `TextData`'s life —
*  including after it is already bound and rendering. Runs are packed synchronously by
*  `createTextData` / `createDefaultTextData` / `updateTextData`, which is why the offset
*  belongs to the owning data rather than to a detached run descriptor.
*
*  - Positive offsets expand the rendered fill outward (bolder / thicker).
*  - Zero removes any previously set offset, returning the run to the base pipeline.
*
*  Offsets are keyed by run identity, so an update that *replaces* a run descriptor (e.g.
*  `updateDefaultTextData`, or `updateTextData({ update: "replaceRun" })`) drops the offset;
*  re-apply it to the new run — by index, most conveniently.
*
*  @param data - The `TextData` (or `DefaultTextData`) that owns the run.
*  @param run - The run to weight: its `GlyphRun` reference, or its index in `data.runs`.
*  @param offset - Contour offset in font design units. Finite, clamped to 0–100. */
function setFontWeightOffset(data, run, offset) {
	if (!Number.isFinite(offset)) {
		console.error("setFontWeightOffset: offset must be finite, got", offset);
		return;
	}
	const target = _resolveRunRef(data, run, "setFontWeightOffset");
	const clamped = Math.min(Math.max(offset, 0), MAX_WEIGHT_OFFSET);
	if (clamped !== offset) console.warn(`setFontWeightOffset: offset ${offset} clamped to ${clamped} (range 0–${MAX_WEIGHT_OFFSET} font units).`);
	if (runOffset(target) === clamped) return;
	if (_offsets === null) {
		_offsets = /* @__PURE__ */ new WeakMap();
		_installTextStyleSeam({
			_key: runGroupKey,
			_param: runOffset
		});
		_installTextVariantResolver(variantForDevice);
	}
	const offsets = _offsets;
	const hadPrevious = offsets.has(target);
	const previous = hadPrevious ? offsets.get(target) : 0;
	if (clamped === 0) offsets.delete(target);
	else offsets.set(target, clamped);
	try {
		updateTextData(data, { update: "reset" });
	} catch (err) {
		if (hadPrevious) offsets.set(target, previous);
		else offsets.delete(target);
		throw err;
	}
}
export { setFontWeightOffset };

//# sourceMappingURL=set-font-weight-offset.js.map