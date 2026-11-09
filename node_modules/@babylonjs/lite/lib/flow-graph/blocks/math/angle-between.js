import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAngleBetween } from "../../fg-math.js";
// src/flow-graph/blocks/math/angle-between.ts
var angleBetweenDef = {
	type: FgBlockType.AngleBetween,
	build: () => ({
		dataIn: [sockIn("a", FgType.Quaternion), sockIn("b", FgType.Quaternion)],
		dataOut: [sockOut("value", FgType.Number)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgAngleBetween(a, b));
	}
};
export { angleBetweenDef };

//# sourceMappingURL=angle-between.js.map