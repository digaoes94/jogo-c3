import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, addPending, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/animation/stop-animation.ts
var DEFAULT_FRAME_RATE = 60;
var stopAnimationDef = {
	type: FgBlockType.StopAnimation,
	build: () => ({
		dataIn: [sockIn("animation", FgType.Reference), sockIn("stopAtFrame", FgType.Number)],
		signalIn: [sigIn("in")],
		signalOut: [sigOut("out"), sigOut("error")]
	}),
	execute(block, ctx, env) {
		const index = toIndex(getDataValue(ctx, env, block, "animation"));
		const group = index === void 0 ? void 0 : env.animations[index];
		if (!group || !env.caps.stopAnimation) {
			activateSignal(ctx, env, block, "error");
			return;
		}
		const frameSocket = block.dataIn.find((s) => s.name === "stopAtFrame");
		if (!(!!(frameSocket && (frameSocket.source || frameSocket.defaultValue !== void 0)) && !!env.caps.stopAnimationAt)) {
			env.caps.stopAnimation(group);
			activateSignal(ctx, env, block, "out");
			return;
		}
		const stopAtFrame = getDataValue(ctx, env, block, "stopAtFrame");
		activateSignal(ctx, env, block, "out");
		addPending(ctx, block, {
			group,
			stopAtFrame
		});
	},
	onTick(_block, _ctx, env, _deltaMs, task) {
		const group = task.state.group;
		if (!group) {
			task.done = true;
			return;
		}
		const stopAtFrame = task.state.stopAtFrame;
		if (group.currentTime * (group.frameRate || DEFAULT_FRAME_RATE) >= stopAtFrame) {
			env.caps.stopAnimationAt?.(group, stopAtFrame);
			task.done = true;
		} else if (!group.isPlaying) task.done = true;
	}
};
function toIndex(value) {
	if (typeof value === "string") {
		const match = /^\/animations\/(\d+)\/?$/.exec(value);
		return match ? Number(match[1]) : void 0;
	}
	if (typeof value === "number") return value | 0;
	if (typeof value === "object" && value !== null && "value" in value) return value.value | 0;
}
export { stopAnimationDef };

//# sourceMappingURL=stop-animation.js.map