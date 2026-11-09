import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { setDataValue } from "../../runtime.js";
import { sockOut } from "../../sockets.js";
// src/flow-graph/blocks/math/constant-e.ts
var eDef = {
	type: FgBlockType.E,
	build: () => ({ dataOut: [sockOut("value", FgType.Number)] }),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "value", Math.E);
	}
};
export { eDef };

//# sourceMappingURL=constant-e.js.map