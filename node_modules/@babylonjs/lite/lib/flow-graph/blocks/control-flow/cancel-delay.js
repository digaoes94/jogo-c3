import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { isFgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/cancel-delay.ts
var cancelDelayDef = {
	type: FgBlockType.CancelDelay,
	build: () => ({
		dataIn: [sockIn("delayIndex", FgType.Integer)],
		signalIn: [sigIn("in")],
		signalOut: [sigOut("out")]
	}),
	execute(block, ctx, env) {
		const raw = getDataValue(ctx, env, block, "delayIndex");
		const idx = isFgInt(raw) ? raw.value : raw;
		if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0) {
			activateSignal(ctx, env, block, "out");
			return;
		}
		const key = `__delay_${idx}`;
		const task = ctx.executionVariables[key];
		if (task) {
			task.canceled = true;
			delete ctx.executionVariables[key];
		}
		activateSignal(ctx, env, block, "out");
	}
};
export { cancelDelayDef };

//# sourceMappingURL=cancel-delay.js.map