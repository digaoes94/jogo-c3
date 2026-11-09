import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgFract } from "../../fg-math.js";
// src/flow-graph/blocks/math/fraction.ts
var fractionDef = {
	type: FgBlockType.Fraction,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgFract(a));
	}
};
export { fractionDef };

//# sourceMappingURL=fraction.js.map