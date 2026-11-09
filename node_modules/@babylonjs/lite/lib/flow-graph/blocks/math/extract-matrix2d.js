import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgExtractMatrix2D } from "../../fg-math.js";
// src/flow-graph/blocks/math/extract-matrix2d.ts
var extractMatrix2DDef = {
	type: FgBlockType.ExtractMatrix2D,
	build: () => ({
		dataIn: [sockIn("input", FgType.Matrix2D)],
		dataOut: Array.from({ length: 4 }, (_, i) => sockOut(`output_${i}`, FgType.Number))
	}),
	updateOutputs(block, ctx, env) {
		const elems = fgExtractMatrix2D(getDataValue(ctx, env, block, "input"));
		for (let i = 0; i < 4; i++) setDataValue(ctx, block, `output_${i}`, elems[i]);
	}
};
export { extractMatrix2DDef };

//# sourceMappingURL=extract-matrix2d.js.map