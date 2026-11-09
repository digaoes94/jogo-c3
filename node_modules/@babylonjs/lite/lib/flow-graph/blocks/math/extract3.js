import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgExtract3 } from "../../fg-math.js";
// src/flow-graph/blocks/math/extract3.ts
var extract3Def = {
	type: FgBlockType.ExtractVector3,
	build: () => ({
		dataIn: [sockIn("a", FgType.Vector3)],
		dataOut: [
			sockOut("x", FgType.Number),
			sockOut("y", FgType.Number),
			sockOut("z", FgType.Number)
		]
	}),
	updateOutputs(block, ctx, env) {
		const [x, y, z] = fgExtract3(getDataValue(ctx, env, block, "a"));
		setDataValue(ctx, block, "x", x);
		setDataValue(ctx, block, "y", y);
		setDataValue(ctx, block, "z", z);
	}
};
export { extract3Def };

//# sourceMappingURL=extract3.js.map