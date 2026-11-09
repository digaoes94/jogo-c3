import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { fgInt } from "../../custom-types/fg-integer.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/conversion/boolean-to-int.ts
var booleanToIntDef = {
	type: FgBlockType.BooleanToInt,
	build: () => ({
		dataIn: [sockIn("a", FgType.Boolean, false)],
		dataOut: [sockOut("value", FgType.Integer)]
	}),
	updateOutputs(block, ctx, env) {
		setDataValue(ctx, block, "value", fgInt(getDataValue(ctx, env, block, "a") ? 1 : 0));
	}
};
export { booleanToIntDef };

//# sourceMappingURL=boolean-to-int.js.map