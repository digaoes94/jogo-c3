import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgQuaternionFromDirections } from "../../fg-math.js";
// src/flow-graph/blocks/math/quaternion-from-directions.ts
var quaternionFromDirectionsDef = {
	type: FgBlockType.QuaternionFromDirections,
	build: () => ({
		dataIn: [sockIn("a", FgType.Vector3), sockIn("b", FgType.Vector3)],
		dataOut: [sockOut("value", FgType.Quaternion)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgQuaternionFromDirections(a, b));
	}
};
export { quaternionFromDirectionsDef };

//# sourceMappingURL=quaternion-from-directions.js.map