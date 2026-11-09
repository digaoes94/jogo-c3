import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAsinh } from "../../fg-math.js";
// src/flow-graph/blocks/math/asinh.ts
var asinhDef = {
	type: FgBlockType.Asinh,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgAsinh(a));
	}
};
export { asinhDef };

//# sourceMappingURL=asinh.js.map