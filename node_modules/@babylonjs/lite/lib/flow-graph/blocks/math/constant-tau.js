import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { setDataValue } from "../../runtime.js";
import { sockOut } from "../../sockets.js";
// src/flow-graph/blocks/math/constant-tau.ts
var tauDef = {
	type: FgBlockType.Tau,
	build: () => ({ dataOut: [sockOut("value", FgType.Number)] }),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "value", 2 * Math.PI);
	}
};
export { tauDef };

//# sourceMappingURL=constant-tau.js.map