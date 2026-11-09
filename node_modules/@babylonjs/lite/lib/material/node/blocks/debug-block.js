// src/material/node/blocks/debug-block.ts
var emitter = {
	className: "NodeMaterialDebugBlock",
	emit(block, _outputName, stage, state, ctx) {
		if (!block.inputs.get("debug")?.source) return {
			expr: "0.0",
			type: "f32"
		};
		return ctx.resolve(block, "debug", stage, state);
	}
};
export { emitter };

//# sourceMappingURL=debug-block.js.map