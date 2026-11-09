import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { isFgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/control-flow/switch.ts
var switchDef = {
	type: FgBlockType.Switch,
	build: (config) => {
		const cases = config?.cases ?? [];
		const signalOut = [sigOut("default")];
		for (const c of cases) signalOut.push(sigOut(`out_${c | 0}`));
		return {
			dataIn: [sockIn("case", FgType.Any)],
			signalIn: [sigIn("in")],
			signalOut
		};
	},
	execute(block, ctx, env) {
		const cases = block.config?.cases ?? [];
		const raw = getDataValue(ctx, env, block, "case");
		const key = isFgInt(raw) ? raw.value : typeof raw === "number" && Number.isInteger(raw) ? raw : void 0;
		const matched = key !== void 0 && cases.some((c) => (c | 0) === key);
		activateSignal(ctx, env, block, matched ? `out_${key}` : "default");
	}
};
export { switchDef };

//# sourceMappingURL=switch.js.map