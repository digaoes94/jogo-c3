import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCos } from "../../fg-math.js";
// src/flow-graph/blocks/math/cos.ts
var cosDef = {
	type: FgBlockType.Cos,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgCos(a));
	}
};
export { cosDef };

//# sourceMappingURL=cos.js.map