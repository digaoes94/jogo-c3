import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { fgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, getExecVar, setDataValue, setExecVar } from "../../runtime.js";
import { sigIn, sigOut, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/wait-all.ts
function inputSignalCount(config) {
	const configured = config?.inputSignalCount;
	return typeof configured === "number" && Number.isFinite(configured) ? Math.max(1, Math.trunc(configured)) : 1;
}
var waitAllDef = {
	type: FgBlockType.WaitAll,
	build: (config) => {
		const n = inputSignalCount(config);
		const signalIn = [sigIn("reset")];
		for (let i = 0; i < n; i++) signalIn.push(sigIn(`in_${i}`));
		return {
			dataOut: [sockOut("remainingInputs", FgType.Integer)],
			signalIn,
			signalOut: [sigOut("out"), sigOut("completed")]
		};
	},
	updateOutputs(block, ctx) {
		const n = inputSignalCount(block.config);
		const state = getExecVar(ctx, block, "activationState", []);
		const remaining = state.length ? state.filter((v) => !v).length : n;
		setDataValue(ctx, block, "remainingInputs", fgInt(remaining));
	},
	execute(block, ctx, env, incomingSignal) {
		const n = inputSignalCount(block.config);
		let state = getExecVar(ctx, block, "activationState", []);
		if (!state.length) state = new Array(n).fill(false);
		if (incomingSignal === "reset") {
			state.fill(false);
			setExecVar(ctx, block, "activationState", state.slice());
			setDataValue(ctx, block, "remainingInputs", fgInt(n));
			return;
		}
		const idxStr = incomingSignal.replace(/^in_/, "");
		const idx = parseInt(idxStr, 10);
		if (!isNaN(idx) && idx >= 0 && idx < n) state[idx] = true;
		const remaining = state.filter((v) => !v).length;
		setDataValue(ctx, block, "remainingInputs", fgInt(remaining));
		setExecVar(ctx, block, "activationState", state.slice());
		if (remaining === 0) {
			state.fill(false);
			setExecVar(ctx, block, "activationState", state.slice());
			activateSignal(ctx, env, block, "completed");
		} else activateSignal(ctx, env, block, "out");
	}
};
export { waitAllDef };

//# sourceMappingURL=wait-all.js.map