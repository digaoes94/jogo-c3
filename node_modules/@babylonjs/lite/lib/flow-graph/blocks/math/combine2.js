import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCombine2 } from "../../fg-math.js";
// src/flow-graph/blocks/math/combine2.ts
var combine2Def = {
	type: FgBlockType.CombineVector2,
	build: () => ({
		dataIn: [sockIn("a", FgType.Number), sockIn("b", FgType.Number)],
		dataOut: [sockOut("value", FgType.Vector2)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgCombine2(a, b));
	}
};
export { combine2Def };

//# sourceMappingURL=combine2.js.map