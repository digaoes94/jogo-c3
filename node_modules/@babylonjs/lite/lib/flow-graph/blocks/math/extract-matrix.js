import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgExtractMatrix } from "../../fg-math.js";
// src/flow-graph/blocks/math/extract-matrix.ts
var extractMatrixDef = {
	type: FgBlockType.ExtractMatrix,
	build: () => ({
		dataIn: [sockIn("input", FgType.Matrix)],
		dataOut: Array.from({ length: 16 }, (_, i) => sockOut(`output_${i}`, FgType.Number))
	}),
	updateOutputs(block, ctx, env) {
		const elems = fgExtractMatrix(getDataValue(ctx, env, block, "input"));
		for (let i = 0; i < 16; i++) setDataValue(ctx, block, `output_${i}`, elems[i]);
	}
};
export { extractMatrixDef };

//# sourceMappingURL=extract-matrix.js.map