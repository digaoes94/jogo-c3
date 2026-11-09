import { createNodeMorphFeature } from "../node-morph.js";
// src/material/node/blocks/morph-targets.ts
var emitter = {
	className: "MorphTargetsBlock",
	stage: "vertex",
	emit(block, outputName, stage, state, ctx) {
		state.usesMorphTargets = true;
		state._vertexFeature = createNodeMorphFeature;
		const kind = outputName.replace(/Output$/, "");
		if (!block.inputs.get(kind)?.source) return fallback(kind);
		const v = ctx.resolve(block, kind, stage, state);
		if (kind === "position") return {
			expr: `nme_morphPosition(${ctx.cast(v, "vec3f").expr}, vertexIndex)`,
			type: "vec3f"
		};
		if (kind === "normal") return {
			expr: `nme_morphNormal(${ctx.cast(v, "vec3f").expr}, vertexIndex)`,
			type: "vec3f"
		};
		if (kind === "tangent" || kind === "uv" || kind === "uv2") return v;
		return v;
	}
};
function fallback(kind) {
	const type = kind === "uv" || kind === "uv2" ? "vec2f" : kind === "tangent" ? "vec4f" : "vec3f";
	return {
		expr: type === "vec2f" ? "vec2<f32>(0.0)" : type === "vec4f" ? "vec4<f32>(0.0)" : "vec3<f32>(0.0)",
		type
	};
}
export { emitter };

//# sourceMappingURL=morph-targets.js.map