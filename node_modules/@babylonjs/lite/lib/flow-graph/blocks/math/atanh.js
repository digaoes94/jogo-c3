import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAtanh } from "../../fg-math.js";
// src/flow-graph/blocks/math/atanh.ts
var atanhDef = {
	type: FgBlockType.Atanh,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgAtanh(a));
	}
};
export { atanhDef };

//# sourceMappingURL=atanh.js.map