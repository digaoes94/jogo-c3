// src/material/node/blocks/arc-tan2-block.ts
var emitter = {
	className: "ArcTan2Block",
	emit(block, _outputName, stage, state, ctx) {
		return {
			expr: `atan2(${ctx.cast(ctx.resolve(block, "x", stage, state), "f32").expr}, ${ctx.cast(ctx.resolve(block, "y", stage, state), "f32").expr})`,
			type: "f32"
		};
	}
};
export { emitter };

//# sourceMappingURL=arc-tan2-block.js.map