import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCombineMatrix } from "../../fg-math.js";
// src/flow-graph/blocks/math/combine-matrix.ts
var combineMatrixDef = {
	type: FgBlockType.CombineMatrix,
	build: () => ({
		dataIn: Array.from({ length: 16 }, (_, i) => sockIn(`input_${i}`, FgType.Number)),
		dataOut: [sockOut("value", FgType.Matrix)]
	}),
	updateOutputs(block, ctx, env) {
		const inputs = Array.from({ length: 16 }, (_, i) => {
			const v = getDataValue(ctx, env, block, `input_${i}`);
			return typeof v === "number" ? v : 0;
		});
		setDataValue(ctx, block, "value", fgCombineMatrix(inputs));
	}
};
export { combineMatrixDef };

//# sourceMappingURL=combine-matrix.js.map