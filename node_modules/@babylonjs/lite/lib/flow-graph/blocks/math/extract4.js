import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgExtract4 } from "../../fg-math.js";
// src/flow-graph/blocks/math/extract4.ts
var extract4Def = {
	type: FgBlockType.ExtractVector4,
	build: () => ({
		dataIn: [sockIn("a", FgType.Vector4)],
		dataOut: [
			sockOut("x", FgType.Number),
			sockOut("y", FgType.Number),
			sockOut("z", FgType.Number),
			sockOut("w", FgType.Number)
		]
	}),
	updateOutputs(block, ctx, env) {
		const [x, y, z, w] = fgExtract4(getDataValue(ctx, env, block, "a"));
		setDataValue(ctx, block, "x", x);
		setDataValue(ctx, block, "y", y);
		setDataValue(ctx, block, "z", z);
		setDataValue(ctx, block, "w", w);
	}
};
export { extract4Def };

//# sourceMappingURL=extract4.js.map