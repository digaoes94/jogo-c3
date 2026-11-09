import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { fgInt, isFgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, getDataValue, setDataValue, setExecVar } from "../../runtime.js";
import { sigIn, sigOut, sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/for-loop.ts
var MAX_ITERATIONS = 1e3;
function toNum(v) {
	if (isFgInt(v)) return v.value;
	return v ?? 0;
}
var forLoopDef = {
	type: FgBlockType.ForLoop,
	build: () => ({
		dataIn: [
			sockIn("startIndex", FgType.Any, 0),
			sockIn("endIndex", FgType.Any, 0),
			sockIn("step", FgType.Number, 1)
		],
		dataOut: [sockOut("index", FgType.Integer)],
		signalIn: [sigIn("in")],
		signalOut: [sigOut("executionFlow"), sigOut("completed")]
	}),
	updateOutputs(block, ctx) {
		const i = ctx.executionVariables[`${block.id}:index`] ?? 0;
		setDataValue(ctx, block, "index", fgInt(i));
	},
	execute(block, ctx, env) {
		const start = toNum(getDataValue(ctx, env, block, "startIndex"));
		const step = toNum(getDataValue(ctx, env, block, "step")) || 1;
		let end = toNum(getDataValue(ctx, env, block, "endIndex"));
		let iterations = 0;
		for (let i = start; i < end; i += step) {
			setExecVar(ctx, block, "index", i);
			setDataValue(ctx, block, "index", fgInt(i));
			activateSignal(ctx, env, block, "executionFlow");
			end = toNum(getDataValue(ctx, env, block, "endIndex"));
			if (++iterations >= MAX_ITERATIONS) break;
		}
		if (block.config?.incrementIndexWhenLoopDone) {
			const cur = toNum(getDataValue(ctx, env, block, "endIndex"));
			setExecVar(ctx, block, "index", cur);
			setDataValue(ctx, block, "index", fgInt(cur));
		}
		activateSignal(ctx, env, block, "completed");
	}
};
export { forLoopDef };

//# sourceMappingURL=for-loop.js.map