import { PBR_HAS_EMISSIVE_COLOR } from "../pbr-flag-bits.js";
// src/material/pbr/fragments/emissive-fragment.ts
/**
* Create an emissive-color fragment.
* @param hasEmissiveTexture - Whether the material also has an emissive texture.
* @param emissiveUV - UV expression for emissiveTexture. This slot replaces the
* template's own emissive line, so it must sample where the template would have.
*/
function createEmissiveColorFragment(hasEmissiveTexture, emissiveUV = "input.uv") {
	return {
		_id: "emissive-color",
		_uboFields: [{
			_name: "emissiveColor",
			_type: "vec3<f32>"
		}, {
			_name: "_emissiveColorPad",
			_type: "f32"
		}],
		_fragmentSlots: { AT: hasEmissiveTexture ? `emissive=material.emissiveColor*textureSample(emissiveTexture,emissiveSampler,${emissiveUV}).rgb;` : `emissive=material.emissiveColor;` }
	};
}
/** Write the emissive-color material-UBO slice. */
function writeEmissiveUBO(data, material, offsets) {
	if (!material._emissiveColor || !offsets.has("emissiveColor")) return;
	const off = offsets.get("emissiveColor") / 4;
	data[off] = material._emissiveColor[0];
	data[off + 1] = material._emissiveColor[1];
	data[off + 2] = material._emissiveColor[2];
}
var pbrExt = {
	id: "emissive-color",
	phase: "fragment",
	detect(mat) {
		return {
			f: mat._emissiveColor ? PBR_HAS_EMISSIVE_COLOR : 0,
			f2: 0
		};
	},
	frag(ctx) {
		if (!(ctx._features & 2097152)) return null;
		const emissiveUV = ctx._features2 & 512 ? "emissiveUV" : (ctx._uv2Mask ?? 0) & 8 ? "input.uv2" : "input.uv";
		return createEmissiveColorFragment((ctx._features & 2) !== 0, emissiveUV);
	},
	writeUbo: writeEmissiveUBO
};
export { createEmissiveColorFragment, pbrExt, writeEmissiveUBO };

//# sourceMappingURL=emissive-fragment.js.map