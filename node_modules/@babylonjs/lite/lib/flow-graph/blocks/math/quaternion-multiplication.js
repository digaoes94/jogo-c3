import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgQuatMul } from "../../fg-math.js";
// src/flow-graph/blocks/math/quaternion-multiplication.ts
var quaternionMultiplicationDef = {
	type: FgBlockType.QuaternionMultiplication,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Quaternion)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgQuatMul(a, b));
	}
};
export { quaternionMultiplicationDef };

//# sourceMappingURL=quaternion-multiplication.js.map