// src/material/node/blocks/color-merger.ts
function tryResolve(block, inputName, stage, state, ctx) {
	if (!block.inputs.get(inputName)?.source) return null;
	return ctx.resolve(block, inputName, stage, state);
}
function swizzleChar(raw, fallback) {
	const s = typeof raw === "string" && raw.length > 0 ? raw[0] : fallback;
	if (s === "r" || s === "x") return "x";
	if (s === "g" || s === "y") return "y";
	if (s === "b" || s === "z") return "z";
	if (s === "a" || s === "w") return "w";
	return fallback;
}
function swizzle(block, len) {
	return `.${(swizzleChar(block.serialized.rSwizzle, "x") + swizzleChar(block.serialized.gSwizzle, "y") + swizzleChar(block.serialized.bSwizzle, "z") + swizzleChar(block.serialized.aSwizzle, "w")).slice(0, len)}`;
}
var emitter = {
	className: "ColorMergerBlock",
	emit(block, outputName, stage, state, ctx) {
		const rgb = tryResolve(block, "rgb", stage, state, ctx);
		const a = tryResolve(block, "a", stage, state, ctx);
		if (rgb) {
			const rgbExpr = ctx.cast(rgb, "vec3f").expr;
			const aExpr = a ? ctx.cast(a, "f32").expr : "0.0";
			if (outputName === "rgba") return {
				expr: `(vec4<f32>(${rgbExpr},${aExpr})${swizzle(block, 4)})`,
				type: "vec4f"
			};
			return {
				expr: `((${rgbExpr})${swizzle(block, 3)})`,
				type: "vec3f"
			};
		}
		const r = tryResolve(block, "r", stage, state, ctx);
		const g = tryResolve(block, "g", stage, state, ctx);
		const b = tryResolve(block, "b", stage, state, ctx);
		const rExpr = r ? ctx.cast(r, "f32").expr : "0.0";
		const gExpr = g ? ctx.cast(g, "f32").expr : "0.0";
		const bExpr = b ? ctx.cast(b, "f32").expr : "0.0";
		const aExpr = a ? ctx.cast(a, "f32").expr : "0.0";
		if (outputName === "rgba") return {
			expr: `(vec4<f32>(${rExpr},${gExpr},${bExpr},${aExpr})${swizzle(block, 4)})`,
			type: "vec4f"
		};
		return {
			expr: `(vec3<f32>(${rExpr},${gExpr},${bExpr})${swizzle(block, 3)})`,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=color-merger.js.map