import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgXor } from "../../fg-math.js";
// src/flow-graph/blocks/math/bitwise-xor.ts
var bitwiseXorDef = {
	type: FgBlockType.BitwiseXor,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgXor(a, b));
	}
};
export { bitwiseXorDef };

//# sourceMappingURL=bitwise-xor.js.map