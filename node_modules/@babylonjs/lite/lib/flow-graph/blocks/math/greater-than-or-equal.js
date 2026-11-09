import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgGe } from "../../fg-math.js";
// src/flow-graph/blocks/math/greater-than-or-equal.ts
var greaterThanOrEqualDef = {
	type: FgBlockType.GreaterThanOrEqual,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgGe(a, b));
	}
};
export { greaterThanOrEqualDef };

//# sourceMappingURL=greater-than-or-equal.js.map