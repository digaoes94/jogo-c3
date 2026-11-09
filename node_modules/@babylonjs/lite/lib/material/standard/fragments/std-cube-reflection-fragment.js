import { HAS_CUBE_REFLECTION } from "../standard-flags.js";
import { _rightHanded } from "#coordinate-system";
// src/material/standard/fragments/std-cube-reflection-fragment.ts
function createStdCubeReflectionFragment() {
	return {
		_id: "std-cube-reflection",
		_bindings: [{
			_name: "cRT",
			_type: {
				_kind: "texture",
				_textureType: "texture_cube<f32>"
			},
			_visibility: 2
		}, {
			_name: "cRS",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: 2
		}],
		_fragmentSlots: { AD: _rightHanded ? `{let v=normalize(input.vp-scene.vEyePosition.xyz);reflectionColor=textureSample(cRT,cRS,reflect(v,normalW)*vec3f(1.,1.,-1.)).rgb*mat.rLvl;}` : `{let v=normalize(input.vp-scene.vEyePosition.xyz);reflectionColor=textureSample(cRT,cRS,reflect(v,normalW)).rgb*mat.rLvl;}` }
	};
}
var stdCubeReflectionExt = {
	_id: "std-cube-reflection",
	_phase: "mesh",
	_feature: HAS_CUBE_REFLECTION,
	_detect: (mat) => mat._reflectionCubeTexture ? HAS_CUBE_REFLECTION : 0,
	_frag: createStdCubeReflectionFragment,
	_bind(mat, entries, b) {
		const cube = mat._reflectionCubeTexture;
		entries.push({
			binding: b++,
			resource: cube._view
		});
		entries.push({
			binding: b++,
			resource: cube._sampler
		});
		return b;
	}
};
export { createStdCubeReflectionFragment, stdCubeReflectionExt };

//# sourceMappingURL=std-cube-reflection-fragment.js.map