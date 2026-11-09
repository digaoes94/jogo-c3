import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgNot } from "../../fg-math.js";
// src/flow-graph/blocks/math/bitwise-not.ts
var bitwiseNotDef = {
	type: FgBlockType.BitwiseNot,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgNot(a));
	}
};
export { bitwiseNotDef };

//# sourceMappingURL=bitwise-not.js.map