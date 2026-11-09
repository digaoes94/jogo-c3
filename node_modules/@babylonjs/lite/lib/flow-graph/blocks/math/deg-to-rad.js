import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgDegToRad } from "../../fg-math.js";
// src/flow-graph/blocks/math/deg-to-rad.ts
var degToRadDef = {
	type: FgBlockType.DegToRad,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgDegToRad(a));
	}
};
export { degToRadDef };

//# sourceMappingURL=deg-to-rad.js.map