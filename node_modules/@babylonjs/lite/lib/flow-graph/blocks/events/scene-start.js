import { FgBlockType } from "../../block-type.js";
import { FgEventType, FgType } from "../../types.js";
import { activateSignal, setDataValue } from "../../runtime.js";
import { sigOut, sockOut } from "../../sockets.js";
// src/flow-graph/blocks/events/scene-start.ts
var sceneStartDef = {
	type: FgBlockType.SceneStart,
	build: () => ({
		dataOut: [sockOut("event", FgType.Reference)],
		signalOut: [sigOut("out"), sigOut("done")],
		event: FgEventType.Start
	}),
	updateOutputs(block, ctx) {
		setDataValue(ctx, block, "event", "/extensions/KHR_interactivity/events/sceneReady");
	},
	execute(block, ctx, env) {
		this.updateOutputs(block, ctx, env);
		activateSignal(ctx, env, block, "done");
		activateSignal(ctx, env, block, "out");
	}
};
export { sceneStartDef };

//# sourceMappingURL=scene-start.js.map