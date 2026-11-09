import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { fgRgbFromOkLCh } from "../../fg-math.js";
// src/flow-graph/blocks/math/rgb-from-oklch.ts
var rgbFromOkLChDef = {
	type: FgBlockType.RGBFromOkLCh,
	build: () => ({
		dataIn: [
			sockIn("l", FgType.Number),
			sockIn("c", FgType.Number),
			sockIn("h", FgType.Number)
		],
		dataOut: [
			sockOut("r", FgType.Number),
			sockOut("g", FgType.Number),
			sockOut("b", FgType.Number)
		]
	}),
	updateOutputs(block, ctx, env) {
		const result = fgRgbFromOkLCh(getDataValue(ctx, env, block, "l"), getDataValue(ctx, env, block, "c"), getDataValue(ctx, env, block, "h"));
		setDataValue(ctx, block, "r", result.r);
		setDataValue(ctx, block, "g", result.g);
		setDataValue(ctx, block, "b", result.b);
	}
};
export { rgbFromOkLChDef };

//# sourceMappingURL=rgb-from-oklch.js.map