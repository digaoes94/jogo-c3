import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgQuaternionFromAngles } from "../../fg-math.js";
// src/flow-graph/blocks/math/quaternion-from-angles.ts
var quaternionFromAnglesDef = {
	type: FgBlockType.QuaternionFromAngles,
	build: () => ({
		dataIn: [
			sockIn("a", FgType.Number),
			sockIn("b", FgType.Number),
			sockIn("c", FgType.Number)
		],
		dataOut: [sockOut("value", FgType.Quaternion)]
	}),
	updateOutputs(block, ctx, env) {
		setDataValue(ctx, block, "value", fgQuaternionFromAngles(getDataValue(ctx, env, block, "a"), getDataValue(ctx, env, block, "b"), getDataValue(ctx, env, block, "c"), block.config?.order));
	}
};
export { quaternionFromAnglesDef };

//# sourceMappingURL=quaternion-from-angles.js.map