import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, addPending, cancelPendingForBlock, getDataValue, getExecVar, setDataValue, setExecVar } from "../../runtime.js";
import { sigIn, sigOut, sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/throttle.ts
var throttleDef = {
	type: FgBlockType.Throttle,
	build: () => ({
		dataIn: [sockIn("duration", FgType.Number, 0)],
		dataOut: [sockOut("lastRemainingTime", FgType.Number)],
		signalIn: [sigIn("in"), sigIn("reset")],
		signalOut: [sigOut("out"), sigOut("error")]
	}),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "lastRemainingTime", getExecVar(ctx, block, "lastRemainingTime", NaN));
	},
	execute(block, ctx, env, incomingSignal) {
		if (incomingSignal === "reset") {
			cancelPendingForBlock(ctx, block);
			setExecVar(ctx, block, "cooldownMs", 0);
			setExecVar(ctx, block, "lastRemainingTime", NaN);
			setDataValue(ctx, block, "lastRemainingTime", NaN);
			return;
		}
		const duration = getDataValue(ctx, env, block, "duration");
		if (!isFinite(duration) || isNaN(duration) || duration <= 0) {
			activateSignal(ctx, env, block, "error");
			return;
		}
		const cooldown = getExecVar(ctx, block, "cooldownMs", 0);
		if (cooldown <= 0) {
			setExecVar(ctx, block, "cooldownMs", duration * 1e3);
			setExecVar(ctx, block, "lastRemainingTime", 0);
			setDataValue(ctx, block, "lastRemainingTime", 0);
			addPending(ctx, block);
			activateSignal(ctx, env, block, "out");
		} else {
			setExecVar(ctx, block, "lastRemainingTime", cooldown / 1e3);
			setDataValue(ctx, block, "lastRemainingTime", cooldown / 1e3);
		}
	},
	onTick(block, ctx, _env, deltaMs, task) {
		const remaining = getExecVar(ctx, block, "cooldownMs", 0) - deltaMs;
		if (remaining <= 0) {
			setExecVar(ctx, block, "cooldownMs", 0);
			task.done = true;
		} else setExecVar(ctx, block, "cooldownMs", remaining);
	},
	cancelPending(block, ctx) {
		setExecVar(ctx, block, "cooldownMs", 0);
	}
};
export { throttleDef };

//# sourceMappingURL=throttle.js.map