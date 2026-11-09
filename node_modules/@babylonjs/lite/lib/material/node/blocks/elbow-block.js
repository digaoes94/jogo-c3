// src/material/node/blocks/elbow-block.ts
var emitter = {
	className: "ElbowBlock",
	emit(block, _outputName, stage, state, ctx) {
		return ctx.resolve(block, "input", stage, state);
	}
};
export { emitter };

//# sourceMappingURL=elbow-block.js.map