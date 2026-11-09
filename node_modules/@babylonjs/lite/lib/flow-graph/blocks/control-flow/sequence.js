import { FgBlockType } from "../../block-type.js";
import { activateSignal } from "../../runtime.js";
import { sigIn, sigOut } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/sequence.ts
var sequenceDef = {
	type: FgBlockType.Sequence,
	build: (config) => {
		const count = Math.max(1, config?.outputSignalCount ?? 1);
		const signalOut = [];
		for (let i = 0; i < count; i++) signalOut.push(sigOut(`out_${i}`));
		return {
			signalIn: [sigIn("in")],
			signalOut
		};
	},
	execute(block, ctx, env) {
		for (const sig of block.signalOut) activateSignal(ctx, env, block, sig.name);
	}
};
export { sequenceDef };

//# sourceMappingURL=sequence.js.map