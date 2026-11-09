import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgTranspose } from "../../fg-math.js";
// src/flow-graph/blocks/math/transpose.ts
var transposeDef = {
	type: FgBlockType.Transpose,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgTranspose(a));
	}
};
export { transposeDef };

//# sourceMappingURL=transpose.js.map