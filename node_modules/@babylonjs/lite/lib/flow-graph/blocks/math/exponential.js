import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgExp } from "../../fg-math.js";
// src/flow-graph/blocks/math/exponential.ts
var exponentialDef = {
	type: FgBlockType.Exponential,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgExp(a));
	}
};
export { exponentialDef };

//# sourceMappingURL=exponential.js.map