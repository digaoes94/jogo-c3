import { widerType } from "./_math-factory.js";
// src/material/node/blocks/distance-block.ts
var emitter = {
	className: "DistanceBlock",
	emit(block, _outputName, stage, state, ctx) {
		const left = ctx.resolve(block, "left", stage, state);
		const right = ctx.resolve(block, "right", stage, state);
		const type = widerType(left.type, right.type);
		return {
			expr: `length(${ctx.cast(left, type).expr} - ${ctx.cast(right, type).expr})`,
			type: "f32"
		};
	}
};
export { emitter };

//# sourceMappingURL=distance-block.js.map