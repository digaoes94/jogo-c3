import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgSin } from "../../fg-math.js";
// src/flow-graph/blocks/math/sin.ts
var sinDef = {
	type: FgBlockType.Sin,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgSin(a));
	}
};
export { sinDef };

//# sourceMappingURL=sin.js.map