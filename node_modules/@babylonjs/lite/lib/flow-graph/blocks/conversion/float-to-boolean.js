import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/conversion/float-to-boolean.ts
var floatToBooleanDef = {
	type: FgBlockType.FloatToBoolean,
	build: () => ({
		dataIn: [sockIn("a", FgType.Number, 0)],
		dataOut: [sockOut("value", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		setDataValue(ctx, block, "value", !!getDataValue(ctx, env, block, "a"));
	}
};
export { floatToBooleanDef };

//# sourceMappingURL=float-to-boolean.js.map