import { FgBlockType } from "../../block-type.js";
import { FgEventType, FgType } from "../../types.js";
import { fgInt } from "../../custom-types/fg-integer.js";
import { activateSignal, getExecVar, setDataValue } from "../../runtime.js";
import { sigOut, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/events/on-select.ts
var onSelectDef = {
	type: FgBlockType.OnSelect,
	build: () => ({
		dataOut: [
			sockOut("selectedNodeIndex", FgType.Integer),
			sockOut("controllerIndex", FgType.Integer),
			sockOut("event", FgType.Reference)
		],
		signalOut: [sigOut("out"), sigOut("done")],
		event: FgEventType.Pointer
	}),
	execute(block, ctx, env) {
		const payload = getExecVar(ctx, block, "lastEvent", void 0);
		const target = block.config?.nodeIndex;
		if (!payload || payload.nodeIndex !== target) return;
		setDataValue(ctx, block, "selectedNodeIndex", fgInt(payload.nodeIndex ?? -1));
		setDataValue(ctx, block, "controllerIndex", fgInt(payload.controllerIndex ?? 0));
		setDataValue(ctx, block, "event", payload.event ?? "/extensions/KHR_interactivity/events/pointer");
		activateSignal(ctx, env, block, "done");
		activateSignal(ctx, env, block, "out");
	}
};
export { onSelectDef };

//# sourceMappingURL=on-select.js.map