import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { setDataValue } from "../../runtime.js";
import { sockOut } from "../../sockets.js";
// src/flow-graph/blocks/math/constant-inf.ts
var infDef = {
	type: FgBlockType.Inf,
	build: () => ({ dataOut: [sockOut("value", FgType.Number)] }),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "value", Number.POSITIVE_INFINITY);
	}
};
export { infDef };

//# sourceMappingURL=constant-inf.js.map