import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCombineMatrix2D } from "../../fg-math.js";
// src/flow-graph/blocks/math/combine-matrix2d.ts
var combineMatrix2DDef = {
	type: FgBlockType.CombineMatrix2D,
	build: () => ({
		dataIn: Array.from({ length: 4 }, (_, i) => sockIn(`input_${i}`, FgType.Number)),
		dataOut: [sockOut("value", FgType.Matrix2D)]
	}),
	updateOutputs(block, ctx, env) {
		const inputs = Array.from({ length: 4 }, (_, i) => {
			const v = getDataValue(ctx, env, block, `input_${i}`);
			return typeof v === "number" ? v : 0;
		});
		setDataValue(ctx, block, "value", fgCombineMatrix2D(inputs));
	}
};
export { combineMatrix2DDef };

//# sourceMappingURL=combine-matrix2d.js.map