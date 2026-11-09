import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { fgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, addPending, cancelPendingForBlock, getDataValue, getExecVar, setDataValue, setExecVar } from "../../runtime.js";
import { sigIn, sigOut, sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/set-delay.ts
/** Global key for the monotonically-increasing delay sequence counter. */
var DELAY_SEQ_KEY = "__delaySeq";
/** Per-index key prefix where the live task object is stored. */
var DELAY_KEY = (idx) => `__delay_${idx}`;
var setDelayDef = {
	type: FgBlockType.SetDelay,
	build: () => ({
		dataIn: [sockIn("duration", FgType.Number, 0)],
		dataOut: [sockOut("lastDelayIndex", FgType.Integer)],
		signalIn: [sigIn("in"), sigIn("cancel")],
		signalOut: [
			sigOut("out"),
			sigOut("done"),
			sigOut("error")
		]
	}),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "lastDelayIndex", fgInt(getExecVar(ctx, block, "lastDelayIndex", -1)));
	},
	execute(block, ctx, env, incomingSignal) {
		if (incomingSignal === "cancel") {
			for (const task of ctx.pending) if (task.blockId === block.id && !task.canceled && !task.done) {
				const idx = task.state.delayIndex;
				delete ctx.executionVariables[DELAY_KEY(idx)];
			}
			cancelPendingForBlock(ctx, block);
			return;
		}
		const duration = getDataValue(ctx, env, block, "duration");
		if (!isFinite(duration) || isNaN(duration) || duration < 0) {
			activateSignal(ctx, env, block, "error");
			return;
		}
		const seq = (ctx.executionVariables[DELAY_SEQ_KEY] ?? -1) + 1;
		ctx.executionVariables[DELAY_SEQ_KEY] = seq;
		setExecVar(ctx, block, "lastDelayIndex", seq);
		setDataValue(ctx, block, "lastDelayIndex", fgInt(seq));
		const task = addPending(ctx, block, {
			remainingMs: duration * 1e3,
			delayIndex: seq
		});
		ctx.executionVariables[DELAY_KEY(seq)] = task;
		activateSignal(ctx, env, block, "out");
	},
	onTick(block, ctx, env, deltaMs, task) {
		const remaining = task.state.remainingMs - deltaMs;
		if (remaining <= 0) {
			task.done = true;
			const idx = task.state.delayIndex;
			delete ctx.executionVariables[DELAY_KEY(idx)];
			activateSignal(ctx, env, block, "done");
		} else task.state.remainingMs = remaining;
	},
	cancelPending(_block, ctx) {
		for (const key of Object.keys(ctx.executionVariables)) if (key.startsWith("__delay_")) {
			if (ctx.executionVariables[key]?.canceled) delete ctx.executionVariables[key];
		}
	}
};
export { setDelayDef };

//# sourceMappingURL=set-delay.js.map