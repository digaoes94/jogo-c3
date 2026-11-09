import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgConjugate } from "../../fg-math.js";
// src/flow-graph/blocks/math/quat-conjugate.ts
var quatConjugateDef = {
	type: FgBlockType.Conjugate,
	build: () => ({
		dataIn: [sockIn("a", FgType.Quaternion)],
		dataOut: [sockOut("value", FgType.Quaternion)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgConjugate(a));
	}
};
export { quatConjugateDef };

//# sourceMappingURL=quat-conjugate.js.map