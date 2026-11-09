import { widerType } from "./_math-factory.js";
// src/material/node/blocks/dot-block.ts
var emitter = {
	className: "DotBlock",
	emit(block, _outputName, stage, state, ctx) {
		const l = ctx.resolve(block, "left", stage, state);
		const r = ctx.resolve(block, "right", stage, state);
		const t = widerType(l.type, r.type);
		return {
			expr: `dot(${ctx.cast(l, t).expr}, ${ctx.cast(r, t).expr})`,
			type: "f32"
		};
	}
};
export { emitter };

//# sourceMappingURL=dot-block.js.map