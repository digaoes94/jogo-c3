import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { setDataValue } from "../../runtime.js";
import { sockOut } from "../../sockets.js";
// src/flow-graph/blocks/math/constant-nan.ts
var nanDef = {
	type: FgBlockType.NaN,
	build: () => ({ dataOut: [sockOut("value", FgType.Number)] }),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "value", NaN);
	}
};
export { nanDef };

//# sourceMappingURL=constant-nan.js.map