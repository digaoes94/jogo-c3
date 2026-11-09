import { FgBlockType } from "../../block-type.js";
import { FgEventType, FgType } from "../../types.js";
import { activateSignal, getExecVar, setDataValue } from "../../runtime.js";
import { sigOut, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/events/receive-custom-event.ts
var receiveCustomEventDef = {
	type: FgBlockType.ReceiveCustomEvent,
	build(config) {
		const valueNames = config?.valueNames ?? [];
		const valueTypes = config?.valueTypes ?? [];
		return {
			dataOut: [sockOut("event", FgType.Reference), ...valueNames.map((name, index) => sockOut(name, valueTypes[index] ?? FgType.Any))],
			signalOut: [sigOut("out"), sigOut("done")],
			event: FgEventType.CustomEvent
		};
	},
	execute(block, ctx, env) {
		const eventId = block.config?.eventId ?? "";
		const valueNames = block.config?.valueNames ?? [];
		const payload = getExecVar(ctx, block, "lastEvent", void 0);
		if (!payload || payload.eventName !== eventId) return;
		setDataValue(ctx, block, "event", payload.event ?? "");
		for (const name of valueNames) {
			const v = payload.values?.[name];
			if (v !== void 0) setDataValue(ctx, block, name, v);
		}
		activateSignal(ctx, env, block, "done");
		activateSignal(ctx, env, block, "out");
	}
};
export { receiveCustomEventDef };

//# sourceMappingURL=receive-custom-event.js.map