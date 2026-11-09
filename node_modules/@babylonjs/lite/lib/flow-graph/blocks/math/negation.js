import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgNeg } from "../../fg-math.js";
// src/flow-graph/blocks/math/negation.ts
var negationDef = {
	type: FgBlockType.Negation,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgNeg(a));
	}
};
export { negationDef };

//# sourceMappingURL=negation.js.map