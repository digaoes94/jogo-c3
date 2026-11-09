import { OPACITY_FROM_RGB } from "../standard-flags.js";
// src/material/standard/fragments/std-opacity-fragment.ts
var STAGE_FRAGMENT = 2;
function createStdOpacityFragment(fromRGB) {
	return {
		_id: "std-opacity",
		_bindings: [{
			_name: "oT",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "oS",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_fragmentSlots: { AT: fromRGB ? `{let opSample=textureSample(oT,oS,input.vu);alpha*=dot(opSample.rgb,vec3<f32>(0.3,0.59,0.11))*mat.opLvl;}` : `alpha*=textureSample(oT,oS,input.vu).a*mat.opLvl;` }
	};
}
var stdOpacityExt = {
	_id: "std-opacity",
	_phase: "mesh",
	_feature: 64,
	_detect: (mat) => mat._opacityTexture ? 64 | (mat.opacityFromRGB ? OPACITY_FROM_RGB : 0) : 0,
	_frag: (features) => createStdOpacityFragment((features & OPACITY_FROM_RGB) !== 0),
	_bind(mat, entries, b) {
		const tex = mat._opacityTexture;
		entries.push({
			binding: b++,
			resource: tex.texture.createView()
		});
		entries.push({
			binding: b++,
			resource: tex.sampler
		});
		return b;
	},
	_textures(mat, out) {
		if (mat._opacityTexture) out.push(mat._opacityTexture);
	}
};
export { createStdOpacityFragment, stdOpacityExt };

//# sourceMappingURL=std-opacity-fragment.js.map