import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCombineMatrix3D } from "../../fg-math.js";
// src/flow-graph/blocks/math/combine-matrix3d.ts
var combineMatrix3DDef = {
	type: FgBlockType.CombineMatrix3D,
	build: () => ({
		dataIn: Array.from({ length: 9 }, (_, i) => sockIn(`input_${i}`, FgType.Number)),
		dataOut: [sockOut("value", FgType.Matrix3D)]
	}),
	updateOutputs(block, ctx, env) {
		const inputs = Array.from({ length: 9 }, (_, i) => {
			const v = getDataValue(ctx, env, block, `input_${i}`);
			return typeof v === "number" ? v : 0;
		});
		setDataValue(ctx, block, "value", fgCombineMatrix3D(inputs));
	}
};
export { combineMatrix3DDef };

//# sourceMappingURL=combine-matrix3d.js.map