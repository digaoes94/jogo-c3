import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgExtractMatrix3D } from "../../fg-math.js";
// src/flow-graph/blocks/math/extract-matrix3d.ts
var extractMatrix3DDef = {
	type: FgBlockType.ExtractMatrix3D,
	build: () => ({
		dataIn: [sockIn("input", FgType.Matrix3D)],
		dataOut: Array.from({ length: 9 }, (_, i) => sockOut(`output_${i}`, FgType.Number))
	}),
	updateOutputs(block, ctx, env) {
		const elems = fgExtractMatrix3D(getDataValue(ctx, env, block, "input"));
		for (let i = 0; i < 9; i++) setDataValue(ctx, block, `output_${i}`, elems[i]);
	}
};
export { extractMatrix3DDef };

//# sourceMappingURL=extract-matrix3d.js.map