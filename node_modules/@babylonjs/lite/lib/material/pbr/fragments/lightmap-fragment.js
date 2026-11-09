import "../../mesh-features.js";
import { PBR2_HAS_UV2 } from "../pbr-flag-bits.js";
// src/material/pbr/fragments/lightmap-fragment.ts
var STAGE_FRAGMENT = 2;
var PBR_LIGHTMAP_SHADOWMAP = 65536;
var PBR_LIGHTMAP_GAMMA = 1 << 18;
var PBR_LIGHTMAP_FLIP_V = 1 << 19;
var PBR_HAS_LIGHTMAP = 1 << 24;
var PBR2_LIGHTMAP_UV2 = 536870912;
var PBR2_HAS_UNLIT = 256;
/**
* Create the lightmap fragment.
* @param usesUV2 - Sample the lightmap from TEXCOORD_1 instead of TEXCOORD_0.
* @param shadowmap - Multiply instead of add (BJS `useLightmapAsShadowmap`).
* @param gamma - Decode the sample from sRGB to linear (BJS `GAMMALIGHTMAP`).
* @param flipV - Sample at `(u, 1 - v)` (BJS `Texture.uAng === π`).
* @param afterUnlit - Order this fragment after the unlit fragment and add emissive
* after the lightmap, matching Babylon.js final composition.
* @param finalColorDependencies - Active fragments that reconstruct final color and
* must complete before the lightmap is composed.
*/
function createLightmapFragment(usesUV2, shadowmap, gamma, flipV, afterUnlit = false, finalColorDependencies = []) {
	const baseUv = usesUV2 ? `input.uv2` : `input.uv`;
	const raw = `textureSample(lmTexture,lmSampler,${flipV ? `vec2<f32>(${baseUv}.x,1.0-${baseUv}.y)` : baseUv}).rgb`;
	const lm = `${gamma ? `pow(${raw},vec3<f32>(2.2))` : raw}*material.lmLvl`;
	const blend = shadowmap ? afterUnlit ? `color=color*(${lm})+emissive;` : `color=(color-emissive)*(${lm})+emissive;` : afterUnlit ? `color+=${lm}+emissive;` : `color+=${lm};`;
	const dependencies = afterUnlit ? [...finalColorDependencies, "unlit"] : finalColorDependencies;
	return {
		_id: "lightmap",
		_dependencies: dependencies.length > 0 ? dependencies : void 0,
		_uboFields: [{
			_name: "lmLvl",
			_type: "f32"
		}],
		_bindings: [{
			_name: "lmTexture",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "lmSampler",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_fragmentSlots: { NI: blend }
	};
}
/** Write the lightmap material-UBO slice. */
function writeLightmapUBO(data, material, offsets) {
	const off = offsets.get("lmLvl");
	if (off === void 0) return;
	data[off / 4] = material.lightmapLevel ?? 1;
}
var pbrExt = {
	id: "lightmap",
	phase: "fragment",
	detect(mat) {
		const m = mat;
		if (!m.lightmapTexture) return {
			f: 0,
			f2: 0
		};
		let f = PBR_HAS_LIGHTMAP;
		let f2 = 0;
		if ((m.lightmapCoordIndex ?? 1) === 1) f2 |= PBR2_HAS_UV2 | PBR2_LIGHTMAP_UV2;
		if (m.useLightmapAsShadowmap) f |= PBR_LIGHTMAP_SHADOWMAP;
		if (m.gammaLightmap) f |= PBR_LIGHTMAP_GAMMA;
		if (!!m.lightmapTexture.invertY !== (m.lightmapTexture.uAng === Math.PI)) f |= PBR_LIGHTMAP_FLIP_V;
		return {
			f,
			f2
		};
	},
	frag(ctx) {
		if (!(ctx._features & PBR_HAS_LIGHTMAP)) return null;
		return createLightmapFragment((ctx._features2 & PBR2_LIGHTMAP_UV2) !== 0 && (ctx._meshFeatures & 128) !== 0, (ctx._features & PBR_LIGHTMAP_SHADOWMAP) !== 0, (ctx._features & PBR_LIGHTMAP_GAMMA) !== 0, (ctx._features & PBR_LIGHTMAP_FLIP_V) !== 0, (ctx._features2 & PBR2_HAS_UNLIT) !== 0, [
			...(ctx._features & 4194304) !== 0 ? ["sheen"] : [],
			...(ctx._features2 & 16) !== 0 ? ["refraction"] : [],
			...(ctx._features & 134217728) !== 0 ? ["subsurface"] : []
		]);
	},
	writeUbo: writeLightmapUBO,
	bind(ctx, entries, b) {
		const tex = ctx._material.lightmapTexture;
		if (!tex) return b;
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
	textures(mat, out) {
		const tex = mat.lightmapTexture;
		if (tex) out.push(tex);
	}
};
export { createLightmapFragment, pbrExt, writeLightmapUBO };

//# sourceMappingURL=lightmap-fragment.js.map