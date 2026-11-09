import { widerType } from "./_math-factory.js";
// src/material/node/blocks/lerp-block.ts
var emitter = {
	className: "LerpBlock",
	emit(block, _outputName, stage, state, ctx) {
		const left = ctx.resolve(block, "left", stage, state);
		const right = ctx.resolve(block, "right", stage, state);
		const gradient = ctx.resolve(block, "gradient", stage, state);
		const t = widerType(left.type, right.type);
		return {
			expr: `mix(${ctx.cast(left, t).expr}, ${ctx.cast(right, t).expr}, ${ctx.cast(gradient, t).expr})`,
			type: t
		};
	}
};
export { emitter };

//# sourceMappingURL=lerp-block.js.map