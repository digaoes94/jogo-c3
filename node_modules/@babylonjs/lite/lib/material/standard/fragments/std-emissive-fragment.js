import { HAS_DEPTH_EMISSIVE_TEXTURE } from "../standard-flags.js";
// src/material/standard/fragments/std-emissive-fragment.ts
var STAGE_FRAGMENT = 2;
function createStdEmissiveFragment(depthTexture) {
	return {
		_id: "std-emissive",
		_bindings: [{
			_name: "eT",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>",
				_sampleType: depthTexture ? "unfilterable-float" : void 0
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "eS",
			_type: {
				_kind: "sampler",
				_samplerType: depthTexture ? "sampler_non_filtering" : "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_fragmentSlots: { AT: `emissiveContrib=mat.ec+textureSample(eT,eS,input.vu).rgb*mat.tl;` }
	};
}
var stdEmissiveExt = {
	_id: "std-emissive",
	_phase: "mesh",
	_feature: 2,
	_detect(mat) {
		if (!mat._emissiveTexture) return 0;
		return 2 | (mat._emissiveTexture._sampleType === "depth" ? HAS_DEPTH_EMISSIVE_TEXTURE : 0);
	},
	_frag: (features) => createStdEmissiveFragment((features & HAS_DEPTH_EMISSIVE_TEXTURE) !== 0),
	_bind(mat, entries, b) {
		const tex = mat._emissiveTexture;
		entries.push({
			binding: b++,
			resource: tex.view
		});
		entries.push({
			binding: b++,
			resource: tex.sampler
		});
		return b;
	},
	_textures(mat, out) {
		if (mat._emissiveTexture) out.push(mat._emissiveTexture);
	}
};
export { createStdEmissiveFragment, stdEmissiveExt };

//# sourceMappingURL=std-emissive-fragment.js.map