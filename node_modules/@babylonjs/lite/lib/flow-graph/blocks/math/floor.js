import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgFloor } from "../../fg-math.js";
// src/flow-graph/blocks/math/floor.ts
var floorDef = {
	type: FgBlockType.Floor,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		setDataValue(ctx, block, "value", fgFloor(getDataValue(ctx, env, block, "a")));
	}
};
export { floorDef };

//# sourceMappingURL=floor.js.map