// src/material/node/blocks/cross-block.ts
var emitter = {
	className: "CrossBlock",
	emit(block, _outputName, stage, state, ctx) {
		return {
			expr: `cross(${ctx.cast(ctx.resolve(block, "left", stage, state), "vec3f").expr}, ${ctx.cast(ctx.resolve(block, "right", stage, state), "vec3f").expr})`,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=cross-block.js.map