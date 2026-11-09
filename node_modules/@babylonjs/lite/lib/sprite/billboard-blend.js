import { _ALPHA_BLEND_STATE, _PREMULTIPLIED_BLEND_STATE } from "./blend-descriptors.js";
// src/sprite/billboard-blend.ts
/** Straight-alpha "over" blending (the default) for transparent billboards. */
var billboardBlendAlpha = {
	_key: "alpha",
	_descriptor: _ALPHA_BLEND_STATE,
	_depthMode: "transparent"
};
/** Premultiplied-alpha "over" blending; per-system opacity scales RGB and A together. */
var billboardBlendPremultiplied = {
	_key: "premultiplied",
	_descriptor: _PREMULTIPLIED_BLEND_STATE,
	_premultipliedOpacity: true,
	_depthMode: "transparent"
};
/**
* Alpha-test cutout: no color blend; fragments below `alphaCutoff` are discarded and surviving
* fragments write depth, so cutout billboards occlude correctly like opaque geometry.
*/
var billboardBlendCutout = {
	_key: "cutout",
	_depthMode: "cutout"
};
/**
* Additive blending for world-space billboards. The billboard's RGB, scaled by its own alpha, is
* added to the framebuffer (no depth write, like the other transparent modes), so overlapping
* billboards stack and brighten — world-space embers, sparks, muzzle flashes, and light shafts.
*/
var billboardBlendAdditive = {
	_key: "additive",
	_descriptor: {
		color: {
			srcFactor: "src-alpha",
			dstFactor: "one",
			operation: "add"
		},
		alpha: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "add"
		}
	},
	_depthMode: "transparent"
};
/** Pure additive blending (`src·1 + dst`), matching the legacy particle OneOne fallback. */
var billboardBlendOneOne = {
	_key: "oneone",
	_descriptor: {
		color: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "add"
		},
		alpha: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "add"
		}
	},
	_depthMode: "transparent"
};
export { billboardBlendAdditive, billboardBlendAlpha, billboardBlendCutout, billboardBlendOneOne, billboardBlendPremultiplied };

//# sourceMappingURL=billboard-blend.js.map