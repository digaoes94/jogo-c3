// src/material/node/blocks/fog-block.ts
var FOG_HELPER_KEY = "nme_fog";
var FOG_HELPER_WGSL = `fn nme_fogFactor(worldPos:vec3<f32>,cameraPos:vec3<f32>,fogParams:vec4<f32>)->f32{let dist=distance(worldPos,cameraPos);let mode=fogParams.x;let density=fogParams.y;let fstart=fogParams.z;let fend=fogParams.w;if(mode<1.5){return clamp(exp(-dist*density),0.0,1.0);}if(mode<2.5){let d=dist*density;return clamp(exp(-d*d),0.0,1.0);}return clamp((fend-dist)/(fend-fstart),0.0,1.0);}`;
var emitter = {
	className: "FogBlock",
	stage: "fragment",
	emit(block, _outputName, stage, state, ctx) {
		state.fragment.helpers.set(FOG_HELPER_KEY, FOG_HELPER_WGSL);
		const wp = ctx.cast(ctx.resolve(block, "worldPosition", stage, state), "vec3f").expr;
		const input = ctx.resolve(block, "input", stage, state);
		const fogColor = ctx.cast(ctx.resolve(block, "fogColor", stage, state), "vec3f").expr;
		const inType = input.type === "vec4f" ? "vec4f" : "vec3f";
		const mixed = `mix(${fogColor}, ${ctx.cast(input, "vec3f").expr}, ${`nme_fogFactor(${wp}, _NME_CAMERA_POS_, _NME_FOG_PARAMS_)`})`;
		if (inType === "vec4f") return {
			expr: `vec4<f32>(${mixed},(${input.expr}).w)`,
			type: "vec4f"
		};
		return {
			expr: mixed,
			type: "vec3f"
		};
	}
};
export { emitter };

//# sourceMappingURL=fog-block.js.map