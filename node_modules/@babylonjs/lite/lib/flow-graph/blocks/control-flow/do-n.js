import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { fgInt, isFgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, getDataValue, getExecVar, setDataValue, setExecVar } from "../../runtime.js";
import { sigIn, sigOut, sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/do-n.ts
function toInt(v) {
	if (isFgInt(v)) return v.value;
	return v | 0;
}
var doNDef = {
	type: FgBlockType.DoN,
	build: () => ({
		dataIn: [sockIn("maxExecutions", FgType.Integer, fgInt(0))],
		dataOut: [sockOut("executionCount", FgType.Integer)],
		signalIn: [sigIn("in"), sigIn("reset")],
		signalOut: [sigOut("out")]
	}),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "executionCount", fgInt(getExecVar(ctx, block, "count", 0)));
	},
	execute(block, ctx, env, incomingSignal) {
		if (incomingSignal === "reset") {
			const startIdx = toInt(block.config?.startIndex ?? 0);
			setExecVar(ctx, block, "count", startIdx);
			setDataValue(ctx, block, "executionCount", fgInt(startIdx));
			return;
		}
		const max = toInt(getDataValue(ctx, env, block, "maxExecutions"));
		const count = getExecVar(ctx, block, "count", 0);
		if (count < max) {
			const next = count + 1;
			setExecVar(ctx, block, "count", next);
			setDataValue(ctx, block, "executionCount", fgInt(next));
			activateSignal(ctx, env, block, "out");
		}
	}
};
export { doNDef };

//# sourceMappingURL=do-n.js.map