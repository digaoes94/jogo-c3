import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgRound } from "../../fg-math.js";
// src/flow-graph/blocks/math/round.ts
var roundDef = {
	type: FgBlockType.Round,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		setDataValue(ctx, block, "value", fgRound(a));
	}
};
export { roundDef };

//# sourceMappingURL=round.js.map