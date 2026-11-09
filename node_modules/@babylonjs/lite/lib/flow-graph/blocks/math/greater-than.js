import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgGt } from "../../fg-math.js";
// src/flow-graph/blocks/math/greater-than.ts
var greaterThanDef = {
	type: FgBlockType.GreaterThan,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgGt(a, b));
	}
};
export { greaterThanDef };

//# sourceMappingURL=greater-than.js.map