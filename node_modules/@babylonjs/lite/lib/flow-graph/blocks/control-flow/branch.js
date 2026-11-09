import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/branch.ts
var branchDef = {
	type: FgBlockType.Branch,
	build: () => ({
		dataIn: [sockIn("condition", FgType.Boolean, false)],
		signalIn: [sigIn("in")],
		signalOut: [sigOut("onTrue"), sigOut("onFalse")]
	}),
	execute(block, ctx, env) {
		if (getDataValue(ctx, env, block, "condition")) activateSignal(ctx, env, block, "onTrue");
		else activateSignal(ctx, env, block, "onFalse");
	}
};
export { branchDef };

//# sourceMappingURL=branch.js.map