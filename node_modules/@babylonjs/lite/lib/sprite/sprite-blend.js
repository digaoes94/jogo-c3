import { _ALPHA_BLEND_STATE, _PREMULTIPLIED_BLEND_STATE } from "./blend-descriptors.js";
// src/sprite/sprite-blend.ts
/**
* Sprite blend modes as importable, pure-data descriptor values.
*
* Each blend mode is its own top-level `const` binding, so a scene ships only the
* descriptor(s) it imports — a default (alpha) scene references `spriteBlendAlpha` and
* nothing else; importing `spriteBlendAdditive` does NOT drag in `spriteBlendPremultiplied`.
* The sprite pipeline reads `_descriptor` / `_key` / `_premultipliedOpacity` directly off
* the value, so there is no runtime string lookup table for the bundler to retain.
*/
/**
* Opaque replacement color. No color blending is configured; every covered sample replaces
* the framebuffer value. Use this for depth-writing alpha-to-coverage layers where fragment
* alpha controls sample coverage rather than color compositing.
*/
var spriteBlendOpaque = { _key: "opaque" };
/**
* Straight-alpha "over" blending (the default). RGB is composited by source alpha; this is
* the standard transparency mode for HUDs, UI, and soft-edged sprites.
*/
var spriteBlendAlpha = {
	_key: "alpha",
	_descriptor: _ALPHA_BLEND_STATE
};
/**
* Premultiplied-alpha "over" blending. The sprite's RGB is assumed already multiplied by its
* alpha; per-layer opacity scales RGB and A together for a correct fade.
*/
var spriteBlendPremultiplied = {
	_key: "premultiplied",
	_descriptor: _PREMULTIPLIED_BLEND_STATE,
	_premultipliedOpacity: true
};
/**
* Additive blending. The sprite's RGB, scaled by its own alpha, is added to the framebuffer,
* so glows / light shafts / sparks stack and brighten (stars, embers, fireflies, sun shafts).
*/
var spriteBlendAdditive = {
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
	}
};
/**
* Pure additive color blending (`src * 1 + dst`) whose color factors match Babylon.js
* `BLENDMODE_ONEONE` / `ALPHA_ONEONE`. This generic descriptor uses `one` / `one`
* alpha factors; exact particle OneOne instead uses `zero` / `one`. Unlike
* {@link spriteBlendAdditive}, source RGB is not weighted by alpha. This is useful
* for particle textures that encode their falloff directly in RGB.
*/
var spriteBlendOneOne = {
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
	}
};
/**
* Multiply blending. The framebuffer is multiplied by the sprite's RGB (`result = src * dst`),
* so the sprite darkens / tints what is behind it — ideal for soft shadow blobs, dirt / grime
* decals, ambient-occlusion stamps, and coloured "gel" overlays that modulate the scene colour.
* Sprites should be opaque (or white where they must leave the background unchanged) since a pure
* multiply ignores source alpha for RGB.
*/
var spriteBlendMultiply = {
	_key: "multiply",
	_descriptor: {
		color: {
			srcFactor: "dst",
			dstFactor: "zero",
			operation: "add"
		},
		alpha: {
			srcFactor: "dst-alpha",
			dstFactor: "zero",
			operation: "add"
		}
	}
};
export { spriteBlendAdditive, spriteBlendAlpha, spriteBlendMultiply, spriteBlendOneOne, spriteBlendOpaque, spriteBlendPremultiplied };

//# sourceMappingURL=sprite-blend.js.map