import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgVectorSlerp } from "../../fg-math.js";
// src/flow-graph/blocks/math/vector-slerp.ts
var vectorSlerpDef = {
	type: FgBlockType.VectorSlerp,
	build: () => ({
		dataIn: [
			sockIn("a", FgType.Any),
			sockIn("b", FgType.Any),
			sockIn("c", FgType.Number)
		],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		setDataValue(ctx, block, "value", fgVectorSlerp(getDataValue(ctx, env, block, "a"), getDataValue(ctx, env, block, "b"), getDataValue(ctx, env, block, "c")));
	}
};
export { vectorSlerpDef };

//# sourceMappingURL=vector-slerp.js.map