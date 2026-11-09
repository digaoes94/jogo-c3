import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgMix } from "../../fg-math.js";
// src/flow-graph/blocks/math/mix.ts
var mathInterpolationDef = {
	type: FgBlockType.MathInterpolation,
	build: () => ({
		dataIn: [
			sockIn("a", FgType.Any),
			sockIn("b", FgType.Any),
			sockIn("c", FgType.Any)
		],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		const c = getDataValue(ctx, env, block, "c");
		setDataValue(ctx, block, "value", fgMix(a, b, c));
	}
};
export { mathInterpolationDef };

//# sourceMappingURL=mix.js.map