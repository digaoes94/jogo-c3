// src/material/node/blocks/view-direction.ts
var emitter = {
	className: "ViewDirectionBlock",
	emit(block, _outputName, stage, state, ctx) {
		const wp = ctx.cast(ctx.resolve(block, "worldPosition", stage, state), "vec3f").expr;
		return {
			expr: `normalize(${ctx.cast(ctx.resolve(block, "cameraPosition", stage, state), "vec3f").expr} - ${wp})`,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=view-direction.js.map