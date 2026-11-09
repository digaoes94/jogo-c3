import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAnd } from "../../fg-math.js";
// src/flow-graph/blocks/math/bitwise-and.ts
var bitwiseAndDef = {
	type: FgBlockType.BitwiseAnd,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgAnd(a, b));
	}
};
export { bitwiseAndDef };

//# sourceMappingURL=bitwise-and.js.map