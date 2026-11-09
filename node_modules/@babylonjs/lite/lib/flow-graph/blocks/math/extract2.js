import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgExtract2 } from "../../fg-math.js";
// src/flow-graph/blocks/math/extract2.ts
var extract2Def = {
	type: FgBlockType.ExtractVector2,
	build: () => ({
		dataIn: [sockIn("a", FgType.Vector2)],
		dataOut: [sockOut("x", FgType.Number), sockOut("y", FgType.Number)]
	}),
	updateOutputs(block, ctx, env) {
		const [x, y] = fgExtract2(getDataValue(ctx, env, block, "a"));
		setDataValue(ctx, block, "x", x);
		setDataValue(ctx, block, "y", y);
	}
};
export { extract2Def };

//# sourceMappingURL=extract2.js.map