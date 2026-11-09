import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { fgInt } from "../../custom-types/fg-integer.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/conversion/float-to-int.ts
var floatToIntDef = {
	type: FgBlockType.FloatToInt,
	build: () => ({
		dataIn: [sockIn("a", FgType.Number, 0)],
		dataOut: [sockOut("value", FgType.Integer)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const mode = block.config?.roundingMode;
		setDataValue(ctx, block, "value", fgInt(mode === "floor" ? Math.floor(a) : mode === "ceil" ? Math.ceil(a) : mode === "round" ? Math.round(a) : Math.trunc(a)));
	}
};
export { floatToIntDef };

//# sourceMappingURL=float-to-int.js.map