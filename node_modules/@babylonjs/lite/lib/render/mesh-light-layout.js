import { MAX_LIGHTS } from "../light/types.js";
// src/render/mesh-light-layout.ts
/** @internal */
function appendMeshLightUboFields(fields) {
	fields.push({
		_name: "lc",
		_type: "u32"
	});
	fields.push({
		_name: "li",
		_type: `array<vec4<u32>, ${Math.ceil(MAX_LIGHTS / 4)}>`
	});
}
/** @internal */
function meshLightIndexWGSL(meshVar, functionName = "mli") {
	return `fn ${functionName}(i:u32)->u32{return ${meshVar}.li[i/4u][i%4u];}`;
}
export { appendMeshLightUboFields, meshLightIndexWGSL };

//# sourceMappingURL=mesh-light-layout.js.map