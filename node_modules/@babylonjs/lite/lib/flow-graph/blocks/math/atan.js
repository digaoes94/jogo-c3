import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAtan } from "../../fg-math.js";
// src/flow-graph/blocks/math/atan.ts
var atanDef = {
	type: FgBlockType.Atan,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgAtan(a));
	}
};
export { atanDef };

//# sourceMappingURL=atan.js.map