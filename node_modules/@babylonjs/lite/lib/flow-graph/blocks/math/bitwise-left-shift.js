import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgLsl } from "../../fg-math.js";
// src/flow-graph/blocks/math/bitwise-left-shift.ts
var bitwiseLeftShiftDef = {
	type: FgBlockType.BitwiseLeftShift,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgLsl(a, b));
	}
};
export { bitwiseLeftShiftDef };

//# sourceMappingURL=bitwise-left-shift.js.map