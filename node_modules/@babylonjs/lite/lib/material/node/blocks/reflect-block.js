// src/material/node/blocks/reflect-block.ts
var emitter = {
	className: "ReflectBlock",
	emit(block, _outputName, stage, state, ctx) {
		return {
			expr: `reflect(${ctx.cast(ctx.resolve(block, "incident", stage, state), "vec3f").expr}, ${ctx.cast(ctx.resolve(block, "normal", stage, state), "vec3f").expr})`,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=reflect-block.js.map