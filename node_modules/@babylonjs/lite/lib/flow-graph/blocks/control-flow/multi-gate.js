import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { fgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, getExecVar, setDataValue, setExecVar } from "../../runtime.js";
import { sigIn, sigOut, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/multi-gate.ts
function nextIndex(used, isRandom, isLoop) {
	if (!used.includes(false)) {
		if (!isLoop) return -1;
		used.fill(false);
	}
	if (!isRandom) return used.indexOf(false);
	const unused = used.map((u, i) => u ? -1 : i).filter((i) => i >= 0);
	if (!unused.length) return -1;
	return unused[Math.floor(Math.random() * unused.length)];
}
var multiGateDef = {
	type: FgBlockType.MultiGate,
	build: (config) => {
		const count = Math.max(1, config?.outputSignalCount ?? 1);
		const signalOut = [];
		for (let i = 0; i < count; i++) signalOut.push(sigOut(`out_${i}`));
		return {
			dataOut: [sockOut("lastIndex", FgType.Integer)],
			signalIn: [sigIn("in"), sigIn("reset")],
			signalOut
		};
	},
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "lastIndex", fgInt(getExecVar(ctx, block, "lastIndex", -1)));
	},
	execute(block, ctx, env, incomingSignal) {
		const count = block.signalOut.length;
		const isRandom = !!block.config?.isRandom;
		const isLoop = !!block.config?.isLoop;
		if (incomingSignal === "reset") {
			setExecVar(ctx, block, "used", new Array(count).fill(false));
			setExecVar(ctx, block, "lastIndex", -1);
			setDataValue(ctx, block, "lastIndex", fgInt(-1));
			return;
		}
		let used = getExecVar(ctx, block, "used", void 0);
		if (!used) used = new Array(count).fill(false);
		const idx = nextIndex(used, isRandom, isLoop);
		if (idx >= 0) {
			used[idx] = true;
			setExecVar(ctx, block, "used", used);
			setExecVar(ctx, block, "lastIndex", idx);
			setDataValue(ctx, block, "lastIndex", fgInt(idx));
			activateSignal(ctx, env, block, `out_${idx}`);
		}
	}
};
export { multiGateDef };

//# sourceMappingURL=multi-gate.js.map