import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { isFgInt } from "../../custom-types/fg-integer.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/conversion/int-to-float.ts
var intToFloatDef = {
	type: FgBlockType.IntToFloat,
	build: () => ({
		dataIn: [sockIn("a", FgType.Integer)],
		dataOut: [sockOut("value", FgType.Number)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", isFgInt(a) ? a.value : a);
	}
};
export { intToFloatDef };

//# sourceMappingURL=int-to-float.js.map