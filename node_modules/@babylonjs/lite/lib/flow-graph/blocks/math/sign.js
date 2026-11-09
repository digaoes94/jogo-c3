import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgSign } from "../../fg-math.js";
// src/flow-graph/blocks/math/sign.ts
var signDef = {
	type: FgBlockType.Sign,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgSign(a));
	}
};
export { signDef };

//# sourceMappingURL=sign.js.map