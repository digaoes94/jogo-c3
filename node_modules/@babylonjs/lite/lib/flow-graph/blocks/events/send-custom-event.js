import { FgBlockType } from "../../block-type.js";
import { FgEventType, FgType } from "../../types.js";
import { pumpFgEvent, queueFgEvent } from "../../event-bus.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/events/send-custom-event.ts
var sendCustomEventDef = {
	type: FgBlockType.SendCustomEvent,
	build(config) {
		const valueNames = config?.valueNames ?? [];
		const valueTypes = config?.valueTypes ?? [];
		const valueDefaults = config?.valueDefaults ?? {};
		return {
			dataIn: valueNames.map((name, index) => sockIn(name, valueTypes[index] ?? FgType.Any, valueDefaults[name])),
			signalIn: [sigIn("in")],
			signalOut: [sigOut("out")]
		};
	},
	execute(block, ctx, env) {
		const eventId = block.config?.eventId ?? "";
		const valueNames = block.config?.valueNames ?? [];
		const values = {};
		for (const name of valueNames) values[name] = getDataValue(ctx, env, block, name);
		(block.config?.dispatchEventsSynchronously === false ? queueFgEvent : pumpFgEvent)(env.events, FgEventType.CustomEvent, {
			eventName: eventId,
			values
		});
		activateSignal(ctx, env, block, "out");
	}
};
export { sendCustomEventDef };

//# sourceMappingURL=send-custom-event.js.map