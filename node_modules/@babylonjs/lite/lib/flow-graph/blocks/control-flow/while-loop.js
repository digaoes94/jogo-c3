import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/while-loop.ts
var MAX_ITERATIONS = 1e3;
var whileLoopDef = {
	type: FgBlockType.WhileLoop,
	build: () => ({
		dataIn: [sockIn("condition", FgType.Boolean, false)],
		signalIn: [sigIn("in")],
		signalOut: [sigOut("executionFlow"), sigOut("completed")]
	}),
	execute(block, ctx, env) {
		let condition = !!block.config?.doWhile || !!getDataValue(ctx, env, block, "condition");
		let i = 0;
		while (condition) {
			activateSignal(ctx, env, block, "executionFlow");
			if (++i >= MAX_ITERATIONS) break;
			condition = !!getDataValue(ctx, env, block, "condition");
		}
		activateSignal(ctx, env, block, "completed");
	}
};
export { whileLoopDef };

//# sourceMappingURL=while-loop.js.map