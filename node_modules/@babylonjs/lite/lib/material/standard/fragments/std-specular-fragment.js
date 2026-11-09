import { SPECULAR_USES_UV2 } from "../standard-flags.js";
// src/material/standard/fragments/std-specular-fragment.ts
var STAGE_FRAGMENT = 2;
function createStdSpecularFragment(usesUV2) {
	return {
		_id: "std-specular",
		_bindings: [{
			_name: "sT",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "sS",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_fragmentSlots: { AT: `specularColor=textureSample(sT,sS,${usesUV2 ? "input.vv" : "input.vu"}).rgb;` }
	};
}
var stdSpecularExt = {
	_id: "std-specular",
	_phase: "mesh",
	_feature: 8,
	_detect: (mat) => mat._specularTexture ? 8 | (mat.specularCoordIndex === 1 ? SPECULAR_USES_UV2 : 0) : 0,
	_frag: (features) => createStdSpecularFragment((features & SPECULAR_USES_UV2) !== 0),
	_bind(mat, entries, b) {
		const tex = mat._specularTexture;
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
		if (mat._specularTexture) out.push(mat._specularTexture);
	}
};
export { createStdSpecularFragment, stdSpecularExt };

//# sourceMappingURL=std-specular-fragment.js.map