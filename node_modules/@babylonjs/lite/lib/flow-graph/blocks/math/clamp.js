import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgClamp } from "../../fg-math.js";
// src/flow-graph/blocks/math/clamp.ts
var clampDef = {
	type: FgBlockType.Clamp,
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
		setDataValue(ctx, block, "value", fgClamp(a, b, c));
	}
};
export { clampDef };

//# sourceMappingURL=clamp.js.map