// src/material/node/blocks/smoothstep-block.ts
var emitter = {
	className: "SmoothStepBlock",
	emit(block, _outputName, stage, state, ctx) {
		const value = ctx.resolve(block, "value", stage, state);
		const edge0 = ctx.resolve(block, "edge0", stage, state);
		const edge1 = ctx.resolve(block, "edge1", stage, state);
		return {
			expr: `smoothstep(${ctx.cast(edge0, value.type).expr}, ${ctx.cast(edge1, value.type).expr}, ${value.expr})`,
			type: value.type
		};
	}
};
export { emitter };

//# sourceMappingURL=smoothstep-block.js.map