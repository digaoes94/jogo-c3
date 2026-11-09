import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgLog10 } from "../../fg-math.js";
// src/flow-graph/blocks/math/log10.ts
var log10Def = {
	type: FgBlockType.Log10,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgLog10(a));
	}
};
export { log10Def };

//# sourceMappingURL=log10.js.map