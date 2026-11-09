import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgRandom } from "../../fg-math.js";
// src/flow-graph/blocks/math/random.ts
var randomDef = {
	type: FgBlockType.Random,
	build: () => ({
		dataIn: [sockIn("min", FgType.Number, 0), sockIn("max", FgType.Number, 1)],
		dataOut: [sockOut("value", FgType.Number)]
	}),
	updateOutputs(block, ctx, env) {
		const min = getDataValue(ctx, env, block, "min");
		const max = getDataValue(ctx, env, block, "max");
		setDataValue(ctx, block, "value", fgRandom(min, max));
	}
};
export { randomDef };

//# sourceMappingURL=random.js.map