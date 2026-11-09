import { FgBlockType } from "../block-type.js";
import { defaultForType } from "../rich-type.js";
import { setDataValue } from "../runtime.js";
import { sigIn, sockIn, sockOut } from "../sockets.js";
// src/flow-graph/blocks/no-op.ts
var noOpDef = {
	type: FgBlockType.NoOp,
	build(config) {
		const inputs = config?.inputs ?? [];
		const outputs = config?.outputs ?? [];
		const signalInputs = config?.signalInputs ?? ["in"];
		return {
			dataIn: inputs.map(({ name, type }) => sockIn(name, type)),
			dataOut: outputs.map(({ name, type }) => sockOut(name, type)),
			signalIn: signalInputs.map(sigIn)
		};
	},
	updateOutputs(block, ctx) {
		for (const output of block.dataOut) {
			const configured = (block.config?.outputs)?.find((socket) => socket.name === output.name);
			setDataValue(ctx, block, output.name, configured?.defaultValue ?? defaultForType(output.type));
		}
	}
};
export { noOpDef };

//# sourceMappingURL=no-op.js.map