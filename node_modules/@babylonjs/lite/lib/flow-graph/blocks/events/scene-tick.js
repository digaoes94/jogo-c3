import { FgBlockType } from "../../block-type.js";
import { FgEventType, FgType } from "../../types.js";
import { activateSignal, getExecVar, setDataValue, setExecVar } from "../../runtime.js";
import { sigOut, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/events/scene-tick.ts
var sceneTickDef = {
	type: FgBlockType.SceneTick,
	build: () => ({
		dataOut: [
			sockOut("timeSinceStart", FgType.Number),
			sockOut("deltaTime", FgType.Number),
			sockOut("event", FgType.Reference)
		],
		signalOut: [sigOut("out"), sigOut("done")],
		event: FgEventType.Tick
	}),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "timeSinceStart", getExecVar(ctx, block, "elapsed", 0));
		setDataValue(ctx, block, "deltaTime", getExecVar(ctx, block, "delta", 0));
		setDataValue(ctx, block, "event", getExecVar(ctx, block, "event", "/extensions/KHR_interactivity/events/sceneTick"));
	},
	execute(block, ctx, env) {
		const delta = getExecVar(ctx, block, "lastEvent", void 0)?.deltaTime ?? 0;
		setExecVar(ctx, block, "elapsed", getExecVar(ctx, block, "elapsed", 0) + delta);
		setExecVar(ctx, block, "delta", delta);
		setExecVar(ctx, block, "event", "/extensions/KHR_interactivity/events/sceneTick");
		this.updateOutputs(block, ctx, env);
		activateSignal(ctx, env, block, "done");
		activateSignal(ctx, env, block, "out");
	}
};
export { sceneTickDef };

//# sourceMappingURL=scene-tick.js.map