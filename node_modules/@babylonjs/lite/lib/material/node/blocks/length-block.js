// src/material/node/blocks/length-block.ts
var emitter = {
	className: "LengthBlock",
	emit(block, _outputName, stage, state, ctx) {
		return {
			expr: `length(${ctx.resolve(block, "value", stage, state).expr})`,
			type: "f32"
		};
	}
};
export { emitter };

//# sourceMappingURL=length-block.js.map