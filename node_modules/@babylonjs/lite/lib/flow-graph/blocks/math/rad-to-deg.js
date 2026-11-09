import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgRadToDeg } from "../../fg-math.js";
// src/flow-graph/blocks/math/rad-to-deg.ts
var radToDegDef = {
	type: FgBlockType.RadToDeg,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgRadToDeg(a));
	}
};
export { radToDegDef };

//# sourceMappingURL=rad-to-deg.js.map