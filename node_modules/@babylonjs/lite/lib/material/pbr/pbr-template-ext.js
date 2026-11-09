// src/material/pbr/pbr-template-ext.ts
var STAGE_FRAGMENT = 2;
/**
* Create a PbrTemplateExt from the given feature flags.
* Each flag corresponds to a detected feature in the scene.
*/
function createPbrTemplateExt(flags) {
	const { _hasUvTransform, _hasVertexColor, _hasUv2, _hasAnyNormal, _hasEmissiveTexture, _hasSpecGloss } = flags;
	const uv2Mask = _hasUv2 ? flags._uv2Mask : 0;
	const baseUvFor = (bit) => uv2Mask & bit ? "input.uv2" : "input.uv";
	const _hasOcclusionUv2 = !!(uv2Mask & 32);
	const _hasOcclusionSplit = _hasUvTransform && ((flags._features2 ?? 0) & 1 << 28) !== 0;
	const uvTransformUboFields = (name) => [{
		_name: `${name}UVm`,
		_type: "vec4<f32>"
	}, {
		_name: `${name}UVt`,
		_type: "vec4<f32>"
	}];
	const uvVarName = (name, bit) => _hasUvTransform ? `${name}UV` : baseUvFor(bit);
	const uvTransformDecl = (name, bit) => _hasUvTransform ? `let ${name}UV=txfUV(${baseUvFor(bit)},material.${name}UVm,material.${name}UVt.xy);` : "";
	const UV_TRANSFORM_HELPER_WGSL = _hasUvTransform ? `fn txfUV(uv:vec2<f32>,m:vec4<f32>,t:vec2<f32>)->vec2<f32>{return vec2<f32>(dot(m.xy,uv),dot(m.zw,uv))+t;}` : "";
	const extraVertexAttributes = [];
	if (_hasUv2) extraVertexAttributes.push({
		_name: "uv2",
		_type: "vec2<f32>",
		_gpuFormat: "float32x2",
		_arrayStride: 8
	});
	if (_hasVertexColor) extraVertexAttributes.push({
		_name: "color",
		_type: "vec4<f32>",
		_gpuFormat: "float32x4",
		_arrayStride: 16
	});
	const extraVaryings = [];
	if (_hasUv2) extraVaryings.push({
		_name: "uv2",
		_type: "vec2<f32>"
	});
	if (_hasVertexColor) extraVaryings.push({
		_name: "vColor",
		_type: "vec4<f32>"
	});
	const extraMaterialUboFields = [];
	if (_hasUvTransform) {
		extraMaterialUboFields.push(...uvTransformUboFields("baseColor"));
		if (_hasAnyNormal) extraMaterialUboFields.push(...uvTransformUboFields("normal"));
		extraMaterialUboFields.push(...uvTransformUboFields("orm"));
		if (_hasOcclusionSplit) extraMaterialUboFields.push(...uvTransformUboFields("occl"));
		if (_hasEmissiveTexture) extraMaterialUboFields.push(...uvTransformUboFields("emissive"));
		if (_hasSpecGloss) extraMaterialUboFields.push(...uvTransformUboFields("specGloss"));
	}
	const extraBindings = [];
	if (_hasOcclusionUv2) extraBindings.push({
		_name: "occlusionTexture",
		_type: {
			_kind: "texture",
			_textureType: "texture_2d<f32>"
		},
		_visibility: STAGE_FRAGMENT
	}, {
		_name: "occlusionSampler_",
		_type: {
			_kind: "sampler",
			_samplerType: "sampler"
		},
		_visibility: STAGE_FRAGMENT
	});
	let vertexBodyExtra = "";
	if (_hasUv2) vertexBodyExtra += "out.uv2 = uv2;\n";
	if (_hasVertexColor) vertexBodyExtra += "out.vColor = color;\n";
	const fragmentHelpers = UV_TRANSFORM_HELPER_WGSL;
	const fragmentPrelude = _hasUvTransform ? uvTransformDecl("baseColor", 1) + (_hasAnyNormal ? uvTransformDecl("normal", 4) : "") + uvTransformDecl("orm", 2) + (_hasOcclusionSplit ? uvTransformDecl("occl", 0) : "") + (_hasEmissiveTexture ? uvTransformDecl("emissive", 8) : "") + (_hasSpecGloss ? uvTransformDecl("specGloss", 16) : "") : "";
	const uvForBaseColor = uvVarName("baseColor", 1);
	const uvForNormal = uvVarName("normal", 4);
	const uvForOrm = uvVarName("orm", 2);
	const uvForEmissive = uvVarName("emissive", 8);
	const uvForSpecGloss = uvVarName("specGloss", 16);
	return {
		extraVertexAttributes,
		extraVaryings,
		extraMaterialUboFields,
		extraBindings,
		vertexBodyExtra,
		fragmentHelpers,
		fragmentPrelude,
		uvForBaseColor,
		uvForNormal,
		uvForOrm,
		uvForEmissive,
		uvForSpecGloss,
		baseColorMod: _hasVertexColor ? `baseColor*=input.vColor.rgb;alpha*=input.vColor.a;` : "",
		normalScaleMod: "let scaledNormal = vec3<f32>(normalMapRaw.xy * material.normalScale, normalMapRaw.z);\n",
		occlusionOverride: _hasOcclusionUv2 ? "let occlusion = textureSample(occlusionTexture, occlusionSampler_, input.uv2).r;" : _hasOcclusionSplit ? "let occlusion = textureSample(ormTexture, ormSampler, occlUV).r;" : null
	};
}
export { createPbrTemplateExt };

//# sourceMappingURL=pbr-template-ext.js.map