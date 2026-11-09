import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/math/conditional.ts
var conditionalDef = {
	type: FgBlockType.Conditional,
	build: () => ({
		dataIn: [
			sockIn("condition", FgType.Boolean, false),
			sockIn("onTrue", FgType.Any),
			sockIn("onFalse", FgType.Any)
		],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const chosen = getDataValue(ctx, env, block, "condition") ? getDataValue(ctx, env, block, "onTrue") : getDataValue(ctx, env, block, "onFalse");
		setDataValue(ctx, block, "value", chosen);
	}
};
export { conditionalDef };

//# sourceMappingURL=conditional.js.map