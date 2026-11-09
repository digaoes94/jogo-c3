import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgLog2 } from "../../fg-math.js";
// src/flow-graph/blocks/math/log2.ts
var log2Def = {
	type: FgBlockType.Log2,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgLog2(a));
	}
};
export { log2Def };

//# sourceMappingURL=log2.js.map