import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgSinh } from "../../fg-math.js";
// src/flow-graph/blocks/math/sinh.ts
var sinhDef = {
	type: FgBlockType.Sinh,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgSinh(a));
	}
};
export { sinhDef };

//# sourceMappingURL=sinh.js.map