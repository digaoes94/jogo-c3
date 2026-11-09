import { LIGHTMAP_FLIP_V, LIGHTMAP_SHADOWMAP } from "../standard-flags.js";
// src/material/standard/fragments/std-lightmap-fragment.ts
var STAGE_FRAGMENT = 2;
function createStdLightmapFragment(usesUV2, shadowmap, flipV) {
	const baseUv = usesUV2 ? "input.vv" : "input.vu";
	const lm = `textureSample(lT,lS,${flipV ? `vec2<f32>(${baseUv}.x,1.0- ${baseUv}.y)` : baseUv}).rgb*mat.lmLvl`;
	const apply = shadowmap ? `color.rgb * (${lm})` : `color.rgb + ${lm}`;
	return {
		_id: "std-lightmap",
		_bindings: [{
			_name: "lT",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "lS",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_fragmentSlots: { BC: `color=vec4<f32>(${apply},color.a);` }
	};
}
var stdLightmapExt = {
	_id: "std-lightmap",
	_phase: "mesh",
	_feature: 32,
	_detect(mat) {
		const tex = mat._lightmapTexture;
		if (!tex) return 0;
		let f = 32;
		if (mat.lightmapCoordIndex === 1) f |= 128;
		if (mat.useLightmapAsShadowmap) f |= LIGHTMAP_SHADOWMAP;
		if (tex.uAng === Math.PI) f |= LIGHTMAP_FLIP_V;
		return f;
	},
	_frag: (features) => createStdLightmapFragment((features & 128) !== 0, (features & LIGHTMAP_SHADOWMAP) !== 0, (features & LIGHTMAP_FLIP_V) !== 0),
	_bind(mat, entries, b) {
		const tex = mat._lightmapTexture;
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
		if (mat._lightmapTexture) out.push(mat._lightmapTexture);
	}
};
export { createStdLightmapFragment, stdLightmapExt };

//# sourceMappingURL=std-lightmap-fragment.js.map