import { MAX_LIGHTS } from "../../../light/types.js";
import "../pbr-flag-bits.js";
// src/material/pbr/fragments/shadow-only-fragment.ts
/** @internal Shared with extensions that must order after shadow-only alpha. */
var PBR2_HAS_SHADOW_ONLY = 1 << 30;
/**
* Create a shadow-only fragment that overrides color/alpha at the BC injection point.
*
* Unrolls a `min()` across the local `shadowFactors` array (declared by the
* multi-light block) to compute the strongest shadow term, then overwrites
* `color` and `alpha` with the shadow-only outputs.
*/
function createShadowOnlyFragment() {
	const unrolled = [];
	for (let i = 0; i < MAX_LIGHTS; i++) unrolled.push(`so_shadowMin=min(so_shadowMin,shadowFactors[${i}]);`);
	return {
		_id: "shadow-only",
		_uboFields: [
			{
				_name: "shadowOnlyColor",
				_type: "vec3<f32>"
			},
			{
				_name: "shadowOnlyOpacity",
				_type: "f32"
			},
			{
				_name: "shadowOnlyFalloff",
				_type: "f32"
			}
		],
		_fragmentSlots: {
			BC: `{var so_shadowMin=1.0;${unrolled.join("\n")} color=material.shadowOnlyColor;alpha=saturate((1.0-so_shadowMin)*material.shadowOnlyFalloff)*material.shadowOnlyOpacity;}`,
			FA: `finalAlpha=alpha*material.materialAlpha;`
		}
	};
}
/** Write the shadow-only material-UBO slice. */
function writeShadowOnlyUBO(data, material, offsets) {
	if (!material._shadowOnly) return;
	if (offsets.has("shadowOnlyColor")) {
		const off = offsets.get("shadowOnlyColor") / 4;
		const tint = material._shadowOnlyColor ?? [
			0,
			0,
			0
		];
		data[off] = tint[0];
		data[off + 1] = tint[1];
		data[off + 2] = tint[2];
	}
	if (offsets.has("shadowOnlyOpacity")) data[offsets.get("shadowOnlyOpacity") / 4] = material._shadowOnlyOpacity ?? 1;
	if (offsets.has("shadowOnlyFalloff")) data[offsets.get("shadowOnlyFalloff") / 4] = material._shadowOnlyFalloff ?? 1;
}
var pbrExt = {
	id: "shadow-only",
	phase: "fragment",
	detect(mat) {
		return mat._shadowOnly ? {
			f: 64,
			f2: PBR2_HAS_SHADOW_ONLY
		} : {
			f: 0,
			f2: 0
		};
	},
	frag(ctx) {
		if (!(ctx._features2 & 1073741824)) return null;
		return createShadowOnlyFragment();
	},
	writeUbo: writeShadowOnlyUBO
};
export { PBR2_HAS_SHADOW_ONLY, createShadowOnlyFragment, pbrExt, writeShadowOnlyUBO };

//# sourceMappingURL=shadow-only-fragment.js.map