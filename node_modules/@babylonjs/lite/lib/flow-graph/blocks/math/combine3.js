import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCombine3 } from "../../fg-math.js";
// src/flow-graph/blocks/math/combine3.ts
var combine3Def = {
	type: FgBlockType.CombineVector3,
	build: () => ({
		dataIn: [
			sockIn("a", FgType.Number),
			sockIn("b", FgType.Number),
			sockIn("c", FgType.Number)
		],
		dataOut: [sockOut("value", FgType.Vector3)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		const c = getDataValue(ctx, env, block, "c");
		setDataValue(ctx, block, "value", fgCombine3(a, b, c));
	}
};
export { combine3Def };

//# sourceMappingURL=combine3.js.map