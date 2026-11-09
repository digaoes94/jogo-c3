import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgAxisAngleFromQuaternion } from "../../fg-math.js";
// src/flow-graph/blocks/math/axis-angle-from-quaternion.ts
var axisAngleFromQuaternionDef = {
	type: FgBlockType.AxisAngleFromQuaternion,
	build: () => ({
		dataIn: [sockIn("a", FgType.Quaternion)],
		dataOut: [
			sockOut("axis", FgType.Vector3),
			sockOut("angle", FgType.Number),
			sockOut("isValid", FgType.Boolean)
		]
	}),
	updateOutputs(block, ctx, env) {
		const { axis, angle, isValid } = fgAxisAngleFromQuaternion(getDataValue(ctx, env, block, "a"));
		setDataValue(ctx, block, "axis", axis);
		setDataValue(ctx, block, "angle", angle);
		setDataValue(ctx, block, "isValid", isValid);
	}
};
export { axisAngleFromQuaternionDef };

//# sourceMappingURL=axis-angle-from-quaternion.js.map