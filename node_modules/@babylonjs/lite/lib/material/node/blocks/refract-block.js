// src/material/node/blocks/refract-block.ts
var emitter = {
	className: "RefractBlock",
	emit(block, _outputName, stage, state, ctx) {
		return {
			expr: `refract(${ctx.cast(ctx.resolve(block, "incident", stage, state), "vec3f").expr}, ${ctx.cast(ctx.resolve(block, "normal", stage, state), "vec3f").expr}, ${ctx.cast(ctx.resolve(block, "ior", stage, state), "f32").expr})`,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=refract-block.js.map