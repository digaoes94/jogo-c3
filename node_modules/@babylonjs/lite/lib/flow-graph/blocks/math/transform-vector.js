import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgTransformVector } from "../../fg-math.js";
// src/flow-graph/blocks/math/transform-vector.ts
var transformVectorDef = {
	type: FgBlockType.TransformVector,
	build: () => ({
		dataIn: [sockIn("a", FgType.Any), sockIn("b", FgType.Any)],
		dataOut: [sockOut("value", FgType.Any)]
	}),
	updateOutputs(block, ctx, env) {
		const a = getDataValue(ctx, env, block, "a");
		const b = getDataValue(ctx, env, block, "b");
		setDataValue(ctx, block, "value", fgTransformVector(a, b));
	}
};
export { transformVectorDef };

//# sourceMappingURL=transform-vector.js.map