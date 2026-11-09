import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCtz } from "../../fg-math.js";
// src/flow-graph/blocks/math/trailing-zeros.ts
var trailingZerosDef = {
	type: FgBlockType.TrailingZeros,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgCtz(a));
	}
};
export { trailingZerosDef };

//# sourceMappingURL=trailing-zeros.js.map