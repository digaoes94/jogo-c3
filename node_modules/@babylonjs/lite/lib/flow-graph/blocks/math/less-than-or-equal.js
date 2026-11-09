import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgLe } from "../../fg-math.js";
// src/flow-graph/blocks/math/less-than-or-equal.ts
var lessThanOrEqualDef = {
	type: FgBlockType.LessThanOrEqual,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgLe(a, b));
	}
};
export { lessThanOrEqualDef };

//# sourceMappingURL=less-than-or-equal.js.map