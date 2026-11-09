import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/conversion/boolean-to-float.ts
var booleanToFloatDef = {
	type: FgBlockType.BooleanToFloat,
	build: () => ({
		dataIn: [sockIn("a", FgType.Boolean, false)],
		dataOut: [sockOut("value", FgType.Number)]
	}),
	updateOutputs(block, ctx, env) {
		setDataValue(ctx, block, "value", getDataValue(ctx, env, block, "a") ? 1 : 0);
	}
};
export { booleanToFloatDef };

//# sourceMappingURL=boolean-to-float.js.map