import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgCbrt } from "../../fg-math.js";
// src/flow-graph/blocks/math/cube-root.ts
var cubeRootDef = {
	type: FgBlockType.CubeRoot,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgCbrt(a));
	}
};
export { cubeRootDef };

//# sourceMappingURL=cube-root.js.map