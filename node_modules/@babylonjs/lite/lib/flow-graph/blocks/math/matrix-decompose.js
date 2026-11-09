import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgMatrixDecompose } from "../../fg-math.js";
// src/flow-graph/blocks/math/matrix-decompose.ts
var matrixDecomposeDef = {
	type: FgBlockType.MatrixDecompose,
	build: () => ({
		dataIn: [sockIn("input", FgType.Matrix)],
		dataOut: [
			sockOut("position", FgType.Vector3),
			sockOut("rotationQuaternion", FgType.Quaternion),
			sockOut("scaling", FgType.Vector3),
			sockOut("isValid", FgType.Boolean)
		]
	}),
	updateOutputs(block, ctx, env) {
		const { position, rotationQuaternion, scaling, isValid } = fgMatrixDecompose(getDataValue(ctx, env, block, "input"));
		setDataValue(ctx, block, "position", position);
		setDataValue(ctx, block, "rotationQuaternion", rotationQuaternion);
		setDataValue(ctx, block, "scaling", scaling);
		setDataValue(ctx, block, "isValid", isValid);
	}
};
export { matrixDecomposeDef };

//# sourceMappingURL=matrix-decompose.js.map