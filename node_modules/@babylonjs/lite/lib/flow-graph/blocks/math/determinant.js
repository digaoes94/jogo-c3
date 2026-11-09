import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgDeterminant } from "../../fg-math.js";
// src/flow-graph/blocks/math/determinant.ts
var determinantDef = {
	type: FgBlockType.Determinant,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Number)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgDeterminant(a));
	}
};
export { determinantDef };

//# sourceMappingURL=determinant.js.map