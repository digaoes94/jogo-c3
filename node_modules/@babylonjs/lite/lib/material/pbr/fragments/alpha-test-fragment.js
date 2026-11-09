import "../pbr-flag-bits.js";
// src/material/pbr/fragments/alpha-test-fragment.ts
var pbrExt = {
	id: "alpha-test",
	phase: "fragment",
	detect(mat) {
		return (mat._alphaCutOff ?? 0) > 0 ? {
			f: 8,
			f2: 0
		} : {
			f: 0,
			f2: 0
		};
	},
	frag(ctx) {
		return ctx._features & 8 ? {
			_id: "alpha-test",
			_dependencies: ctx._pi ? [`plugin-${ctx._pi}`] : void 0,
			_uboFields: [{
				_name: "alphaCutOff",
				_type: "f32"
			}],
			_fragmentSlots: { AT: `if(alpha*material.materialAlpha<material.alphaCutOff){discard;}` }
		} : null;
	},
	writeUbo(data, mat, offsets) {
		const off = offsets.get("alphaCutOff");
		if (off !== void 0) data[off / 4] = mat._alphaCutOff ?? 0;
	}
};
export { pbrExt };

//# sourceMappingURL=alpha-test-fragment.js.map