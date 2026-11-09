import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCombine4 } from "../../fg-math.js";
// src/flow-graph/blocks/math/combine4.ts
var combine4Def = {
	type: FgBlockType.CombineVector4,
	build: () => ({
		dataIn: [
			sockIn("a", FgType.Number),
			sockIn("b", FgType.Number),
			sockIn("c", FgType.Number),
			sockIn("d", FgType.Number)
		],
		dataOut: [sockOut("value", FgType.Vector4)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		const c = getDataValue(ctx, env, block, "c");
		const d = getDataValue(ctx, env, block, "d");
		setDataValue(ctx, block, "value", fgCombine4(a, b, c, d));
	}
};
export { combine4Def };

//# sourceMappingURL=combine4.js.map