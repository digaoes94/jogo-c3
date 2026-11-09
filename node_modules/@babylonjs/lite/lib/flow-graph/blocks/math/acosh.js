import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAcosh } from "../../fg-math.js";
// src/flow-graph/blocks/math/acosh.ts
var acoshDef = {
	type: FgBlockType.Acosh,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgAcosh(a));
	}
};
export { acoshDef };

//# sourceMappingURL=acosh.js.map