import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAcos } from "../../fg-math.js";
// src/flow-graph/blocks/math/acos.ts
var acosDef = {
	type: FgBlockType.Acos,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgAcos(a));
	}
};
export { acosDef };

//# sourceMappingURL=acos.js.map