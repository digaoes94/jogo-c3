import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgSqrt } from "../../fg-math.js";
// src/flow-graph/blocks/math/square-root.ts
var squareRootDef = {
	type: FgBlockType.SquareRoot,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgSqrt(a));
	}
};
export { squareRootDef };

//# sourceMappingURL=square-root.js.map