import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { setDataValue } from "../../runtime.js";
import { sockOut } from "../../sockets.js";
// src/flow-graph/blocks/data/constant.ts
var constantDef = {
	type: FgBlockType.Constant,
	build: () => ({ dataOut: [sockOut("value", FgType.Any)] }),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "value", block.config?.value ?? void 0);
	}
};
export { constantDef };

//# sourceMappingURL=constant.js.map