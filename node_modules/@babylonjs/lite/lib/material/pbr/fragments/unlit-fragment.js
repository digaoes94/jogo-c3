// src/material/pbr/fragments/unlit-fragment.ts
var PBR2_HAS_UNLIT = 256;
function createUnlitFragment(hasIbl) {
	const assign = `color=baseColor*material.unlitColor;`;
	return {
		_id: "unlit",
		_dependencies: hasIbl ? ["ibl"] : void 0,
		_uboFields: [{
			_name: "unlitColor",
			_type: "vec3<f32>"
		}, {
			_name: "_unlitColorPad",
			_type: "f32"
		}],
		_fragmentSlots: hasIbl ? { AI: assign } : { NI: assign }
	};
}
/** Write the unlit material-UBO slice. */
function writeUnlitUBO(data, material, offsets) {
	if (!material._unlit || !offsets.has("unlitColor")) return;
	const off = offsets.get("unlitColor") / 4;
	const tint = material._unlitColor ?? [
		1,
		1,
		1
	];
	data[off] = tint[0];
	data[off + 1] = tint[1];
	data[off + 2] = tint[2];
}
var pbrExt = {
	id: "unlit",
	phase: "fragment",
	detect(mat) {
		return mat._unlit ? {
			f: 0,
			f2: PBR2_HAS_UNLIT
		} : {
			f: 0,
			f2: 0
		};
	},
	frag(ctx) {
		if (!(ctx._features2 & PBR2_HAS_UNLIT)) return null;
		return createUnlitFragment(ctx._hasIbl);
	},
	writeUbo: writeUnlitUBO
};
export { createUnlitFragment, pbrExt, writeUnlitUBO };

//# sourceMappingURL=unlit-fragment.js.map