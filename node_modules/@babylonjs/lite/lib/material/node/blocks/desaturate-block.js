// src/material/node/blocks/desaturate-block.ts
var emitter = {
	className: "DesaturateBlock",
	emit(block, _outputName, stage, state, ctx) {
		const color = ctx.cast(ctx.resolve(block, "color", stage, state), "vec3f").expr;
		const level = ctx.cast(ctx.resolve(block, "level", stage, state), "f32").expr;
		return {
			expr: `mix(${color},vec3<f32>(${`(0.5 * (${`min(min((${color}).x, (${color}).y), (${color}).z)`} + ${`max(max((${color}).x, (${color}).y), (${color}).z)`}))`}),${level})`,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=desaturate-block.js.map