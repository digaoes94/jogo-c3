import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { setDataValue } from "../../runtime.js";
import { sockOut } from "../../sockets.js";
// src/flow-graph/blocks/math/constant-pi.ts
var piDef = {
	type: FgBlockType.PI,
	build: () => ({ dataOut: [sockOut("value", FgType.Number)] }),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "value", Math.PI);
	}
};
export { piDef };

//# sourceMappingURL=constant-pi.js.map