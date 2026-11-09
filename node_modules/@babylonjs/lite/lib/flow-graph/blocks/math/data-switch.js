import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { isFgInt } from "../../custom-types/fg-integer.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/math/data-switch.ts
var dataSwitchDef = {
	type: FgBlockType.DataSwitch,
	build: (config) => {
		const cases = config?.cases ?? [];
		const dataIn = [sockIn("case", FgType.Any), sockIn("default", FgType.Any)];
		for (const c of cases) dataIn.push(sockIn(`in_${c | 0}`, FgType.Any));
		return {
			dataIn,
			dataOut: [sockOut("value", FgType.Any)]
		};
	},
	updateOutputs(block, ctx, env) {
		const cases = block.config?.cases ?? [];
		const selector = getDataValue(ctx, env, block, "case");
		const key = isFgInt(selector) ? selector.value : selector;
		const socket = typeof key === "number" && cases.some((c) => (c | 0) === (key | 0)) ? `in_${key | 0}` : "default";
		setDataValue(ctx, block, "value", getDataValue(ctx, env, block, socket));
	}
};
export { dataSwitchDef };

//# sourceMappingURL=data-switch.js.map