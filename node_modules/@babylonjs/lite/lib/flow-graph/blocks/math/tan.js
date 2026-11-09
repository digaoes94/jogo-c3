import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgTan } from "../../fg-math.js";
// src/flow-graph/blocks/math/tan.ts
var tanDef = {
	type: FgBlockType.Tan,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgTan(a));
	}
};
export { tanDef };

//# sourceMappingURL=tan.js.map