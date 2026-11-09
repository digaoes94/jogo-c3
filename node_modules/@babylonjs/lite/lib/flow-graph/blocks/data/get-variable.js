import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { setDataValue } from "../../runtime.js";
import { sockOut } from "../../sockets.js";
// src/flow-graph/blocks/data/get-variable.ts
var getVariableDef = {
	type: FgBlockType.GetVariable,
	build: () => ({ dataOut: [sockOut("value", FgType.Any)] }),
	updateOutputs(block, ctx) {
		const name = block.config?.variable;
		setDataValue(ctx, block, "value", ctx.userVariables[name]);
	}
};
export { getVariableDef };

//# sourceMappingURL=get-variable.js.map