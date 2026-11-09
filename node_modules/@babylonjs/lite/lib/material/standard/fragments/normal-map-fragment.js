import "../standard-flags.js";
import { WGSL_PERTURB_NORMAL } from "../../../shader/wgsl-helpers.js";
// src/material/standard/fragments/normal-map-fragment.ts
var STAGE_FRAGMENT = 2;
/**
* Create a bump/normal map fragment for Standard material.
* @param bumpLevel - The bump level (1.0 = default). bumpScale = 1/bumpLevel.
*/
function createNormalMapFragment() {
	return {
		_id: "normal-map",
		_bindings: [{
			_name: "bT",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "bS",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_helperFunctions: WGSL_PERTURB_NORMAL,
		_fragmentSlots: { AC: `normalW=perturbNormal(input.vn,input.vp,input.vu,mat.bs);` }
	};
}
var bumpStdExt = {
	_id: "normal-map",
	_phase: "mesh",
	_feature: 4,
	_detect: (mat) => mat._bumpTexture ? 4 : 0,
	_frag: createNormalMapFragment,
	_bind(mat, entries, b) {
		const tex = mat._bumpTexture;
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
		if (mat._bumpTexture) out.push(mat._bumpTexture);
	}
};
export { bumpStdExt, createNormalMapFragment };

//# sourceMappingURL=normal-map-fragment.js.map