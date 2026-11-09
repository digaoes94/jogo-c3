import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgIsNaN } from "../../fg-math.js";
// src/flow-graph/blocks/math/is-nan.ts
var isNaNDef = {
	type: FgBlockType.IsNaN,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgIsNaN(a));
	}
};
export { isNaNDef };

//# sourceMappingURL=is-nan.js.map