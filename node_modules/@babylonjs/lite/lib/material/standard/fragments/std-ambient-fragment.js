import "../standard-flags.js";
// src/material/standard/fragments/std-ambient-fragment.ts
var STAGE_FRAGMENT = 2;
function createStdAmbientFragment(usesUV2) {
	return {
		_id: "std-ambient",
		_bindings: [{
			_name: "aT",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "aS",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_fragmentSlots: { AD: `baseAmbientColor=textureSample(aT,aS,${usesUV2 ? "input.vv" : "input.vu"}).rgb*mat.ambTexLvl;` }
	};
}
var stdAmbientExt = {
	_id: "std-ambient",
	_phase: "mesh",
	_feature: 16,
	_detect: (mat) => mat._ambientTexture ? 16 | (mat.ambientCoordIndex === 1 ? 256 : 0) : 0,
	_frag: (features) => createStdAmbientFragment((features & 256) !== 0),
	_bind(mat, entries, b) {
		const tex = mat._ambientTexture;
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
		if (mat._ambientTexture) out.push(mat._ambientTexture);
	}
};
export { createStdAmbientFragment, stdAmbientExt };

//# sourceMappingURL=std-ambient-fragment.js.map