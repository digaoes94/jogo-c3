import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgClz } from "../../fg-math.js";
// src/flow-graph/blocks/math/leading-zeros.ts
var leadingZerosDef = {
	type: FgBlockType.LeadingZeros,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgClz(a));
	}
};
export { leadingZerosDef };

//# sourceMappingURL=leading-zeros.js.map