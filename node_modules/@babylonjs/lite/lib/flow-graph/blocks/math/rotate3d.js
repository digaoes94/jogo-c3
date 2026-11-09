import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgRotate3D } from "../../fg-math.js";
// src/flow-graph/blocks/math/rotate3d.ts
var rotate3DDef = {
	type: FgBlockType.Rotate3D,
	build: () => ({
		dataIn: [sockIn("a", FgType.Vector3), sockIn("b", FgType.Quaternion)],
		dataOut: [sockOut("value", FgType.Vector3)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgRotate3D(a, b));
	}
};
export { rotate3DDef };

//# sourceMappingURL=rotate3d.js.map