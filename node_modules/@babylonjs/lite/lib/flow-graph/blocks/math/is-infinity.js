import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgIsInf } from "../../fg-math.js";
// src/flow-graph/blocks/math/is-infinity.ts
var isInfinityDef = {
	type: FgBlockType.IsInfinity,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgIsInf(a));
	}
};
export { isInfinityDef };

//# sourceMappingURL=is-infinity.js.map