import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgQuaternionFromAxisAngle } from "../../fg-math.js";
// src/flow-graph/blocks/math/quaternion-from-axis-angle.ts
var quaternionFromAxisAngleDef = {
	type: FgBlockType.QuaternionFromAxisAngle,
	build: () => ({
		dataIn: [sockIn("a", FgType.Vector3), sockIn("b", FgType.Number)],
		dataOut: [sockOut("value", FgType.Quaternion)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgQuaternionFromAxisAngle(a, b));
	}
};
export { quaternionFromAxisAngleDef };

//# sourceMappingURL=quaternion-from-axis-angle.js.map