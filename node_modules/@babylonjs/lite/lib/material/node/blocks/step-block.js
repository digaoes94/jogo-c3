// src/material/node/blocks/step-block.ts
var emitter = {
	className: "StepBlock",
	emit(block, _outputName, stage, state, ctx) {
		const value = ctx.resolve(block, "value", stage, state);
		const edge = ctx.resolve(block, "edge", stage, state);
		return {
			expr: `step(${ctx.cast(edge, value.type).expr}, ${value.expr})`,
			type: value.type
		};
	}
};
export { emitter };

//# sourceMappingURL=step-block.js.map