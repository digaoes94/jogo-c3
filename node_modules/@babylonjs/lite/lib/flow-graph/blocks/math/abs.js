import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAbs } from "../../fg-math.js";
// src/flow-graph/blocks/math/abs.ts
var absDef = {
	type: FgBlockType.Abs,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		setDataValue(ctx, block, "value", fgAbs(getDataValue(ctx, env, block, "a")));
	}
};
export { absDef };

//# sourceMappingURL=abs.js.map