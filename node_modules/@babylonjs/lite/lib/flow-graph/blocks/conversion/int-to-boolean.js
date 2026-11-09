import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { isFgInt } from "../../custom-types/fg-integer.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/conversion/int-to-boolean.ts
var intToBooleanDef = {
	type: FgBlockType.IntToBoolean,
	build: () => ({
		dataIn: [sockIn("a", FgType.Integer)],
		dataOut: [sockOut("value", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", isFgInt(a) ? a.value !== 0 : !!a);
	}
};
export { intToBooleanDef };

//# sourceMappingURL=int-to-boolean.js.map