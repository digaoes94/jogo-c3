import { systemBlock } from "./system-block.js";
// src/particle/node/blocks/system-dynamic-emit-rate-block.ts
/** `SystemBlock` evaluator for a connected emit-rate graph. */
var systemDynamicEmitRateBlock = { build(block, ctx) {
	systemBlock.build(block, ctx);
	const system = ctx.state.system;
	const emitRateGetter = ctx.input(block, "emitRate", () => system.emitRate);
	system._emitRateGetter = () => {
		const emitRate = emitRateGetter(0);
		return typeof emitRate === "number" ? emitRate : system.emitRate;
	};
} };
export { systemDynamicEmitRateBlock };

//# sourceMappingURL=system-dynamic-emit-rate-block.js.map