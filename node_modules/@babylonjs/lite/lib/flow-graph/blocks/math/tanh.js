import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgTanh } from "../../fg-math.js";
// src/flow-graph/blocks/math/tanh.ts
var tanhDef = {
	type: FgBlockType.Tanh,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgTanh(a));
	}
};
export { tanhDef };

//# sourceMappingURL=tanh.js.map