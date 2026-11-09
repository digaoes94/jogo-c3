import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgRotate2D } from "../../fg-math.js";
// src/flow-graph/blocks/math/rotate2d.ts
var rotate2DDef = {
	type: FgBlockType.Rotate2D,
	build: () => ({
		dataIn: [sockIn("a", FgType.Vector2), sockIn("b", FgType.Number)],
		dataOut: [sockOut("value", FgType.Vector2)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgRotate2D(a, b));
	}
};
export { rotate2DDef };

//# sourceMappingURL=rotate2d.js.map