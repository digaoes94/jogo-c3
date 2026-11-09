import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, addPending, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/animation/play-animation.ts
var playAnimationDef = {
	type: FgBlockType.PlayAnimation,
	build: () => ({
		dataIn: [
			sockIn("animation", FgType.Reference),
			sockIn("speed", FgType.Number, 1),
			sockIn("loop", FgType.Boolean, false),
			sockIn("from", FgType.Number, 0),
			sockIn("to", FgType.Number)
		],
		signalIn: [sigIn("in")],
		signalOut: [
			sigOut("out"),
			sigOut("done"),
			sigOut("error")
		]
	}),
	execute(block, ctx, env) {
		const index = toIndex(getDataValue(ctx, env, block, "animation"));
		const group = index === void 0 ? void 0 : env.animations[index];
		if (!group || !env.caps.playAnimation) {
			activateSignal(ctx, env, block, "error");
			return;
		}
		const speed = getDataValue(ctx, env, block, "speed");
		const loop = getDataValue(ctx, env, block, "loop");
		env.caps.playAnimation(group, {
			speed,
			loop
		});
		activateSignal(ctx, env, block, "out");
		const task = addPending(ctx, block, { group });
		if (env.caps.onAnimationEnd) task.state.unsub = env.caps.onAnimationEnd(group, () => {
			task.done = true;
			activateSignal(ctx, env, block, "done");
		});
	},
	onTick(block, ctx, env, _deltaMs, task) {
		if (task.state.unsub) return;
		const group = task.state.group;
		if (group && !group.isPlaying) {
			task.done = true;
			activateSignal(ctx, env, block, "done");
		}
	},
	cancelPending(block, ctx) {
		for (const task of ctx.pending) if (task.blockId === block.id) task.state.unsub?.();
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
export { playAnimationDef };

//# sourceMappingURL=play-animation.js.map