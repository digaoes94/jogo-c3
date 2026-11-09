import { appendMeshLightUboFields, meshLightIndexWGSL } from "../../render/mesh-light-layout.js";
import { PBR_DISPLAY_OUTPUT_WGSL, PBR_EXPOSURE_WGSL } from "./pbr-image-processing-output-wgsl.js";
import { PBR_BRDF_WGSL, PBR_ROUGHNESS_WGSL, PBR_SPECULAR_AA_WGSL } from "./pbr-brdf-wgsl.js";
// src/material/pbr/pbr-template.ts
var STAGE_FRAGMENT = 2;
/**
* Create a PBR ShaderTemplate from the given configuration.
* The template contains slot markers that the composer fills with fragment code.
*/
function createPbrTemplate(config) {
	const { _hasSingleLight = false, _hasMultiLight = false, _singleLightWGSL = "", _singleLightBlock = "", _multiLightWGSL = "", _multiLightLoop = "", _tangentNormal, _cotangentNormal, _flatGeometricNormal = false, _flatNormalWgsl = "", _hasEmissiveTexture = false, _specGloss, _hasDoubleSided = false, _hasTonemap = false, _fogHelper = "", _fogBlock = "", _toneMappingHelpers = "", _toneMappingCall = "", _hasAlphaBlend = false, _hasSpecularAA = false, _hasGammaAlbedo = false, _hasBaseColorFactor = false, _hasMorph = false, _hasOcclusion = false, _hasEmissiveColor = false, _hasReflectanceExt = false, _hasIbl = false, _hasAnisotropy = false, _anisoBrdfFunctions = "", _anisoTBBlock = "", _ext, _gammaBaseColor, _noColorOutput = false, _esmShadowOutput = false, _esmShadowDepthCode = "" } = config;
	const hasNormal = !!_tangentNormal;
	const hasAnyNormal = hasNormal || !!_cotangentNormal;
	const _baseVertexAttributes = [{
		_name: "position",
		_type: "vec3<f32>",
		_gpuFormat: "float32x3",
		_arrayStride: 12
	}, {
		_name: "normal",
		_type: "vec3<f32>",
		_gpuFormat: "float32x3",
		_arrayStride: 12
	}];
	if (hasNormal) _baseVertexAttributes.push({
		_name: "tangent",
		_type: "vec4<f32>",
		_gpuFormat: "float32x4",
		_arrayStride: 16
	});
	_baseVertexAttributes.push({
		_name: "uv",
		_type: "vec2<f32>",
		_gpuFormat: "float32x2",
		_arrayStride: 8
	});
	if (_ext) _baseVertexAttributes.push(..._ext.extraVertexAttributes);
	const _baseVaryings = [{
		_name: "worldPos",
		_type: "vec3<f32>"
	}, {
		_name: "worldNormal",
		_type: "vec3<f32>"
	}];
	if (hasNormal) _baseVaryings.push({
		_name: "worldTangent",
		_type: "vec3<f32>"
	}, {
		_name: "worldBitangent",
		_type: "vec3<f32>"
	});
	_baseVaryings.push({
		_name: "uv",
		_type: "vec2<f32>"
	});
	if (_ext) _baseVaryings.push(..._ext.extraVaryings);
	const _baseMeshUboFields = [{
		_name: "world",
		_type: "mat4x4<f32>"
	}];
	appendMeshLightUboFields(_baseMeshUboFields);
	const _baseMaterialUboFields = [
		{
			_name: "environmentIntensity",
			_type: "f32"
		},
		{
			_name: "directIntensity",
			_type: "f32"
		},
		{
			_name: "reflectance",
			_type: "f32"
		},
		{
			_name: "materialAlpha",
			_type: "f32"
		},
		..._hasBaseColorFactor ? [{
			_name: "baseColorFactor",
			_type: "vec4<f32>"
		}] : [],
		{
			_name: "metallicFactor",
			_type: "f32"
		},
		{
			_name: "roughnessFactor",
			_type: "f32"
		},
		{
			_name: "normalScale",
			_type: "f32"
		},
		{
			_name: "lightFalloffMode",
			_type: "f32"
		},
		..._hasAnisotropy ? [{
			_name: "anisotropyParams",
			_type: "vec4<f32>"
		}] : [],
		..._ext ? _ext.extraMaterialUboFields : []
	];
	const tex2d = (name, sampler) => [{
		_name: name,
		_type: {
			_kind: "texture",
			_textureType: "texture_2d<f32>"
		},
		_visibility: STAGE_FRAGMENT
	}, {
		_name: sampler,
		_type: {
			_kind: "sampler",
			_samplerType: "sampler"
		},
		_visibility: STAGE_FRAGMENT
	}];
	const _baseBindings = tex2d("baseColorTexture", "baseColorSampler");
	if (hasAnyNormal) _baseBindings.push(...tex2d("normalTexture", "normalSampler_"));
	_baseBindings.push(...tex2d("ormTexture", "ormSampler"));
	if (_ext) _baseBindings.push(..._ext.extraBindings);
	if (_hasEmissiveTexture) _baseBindings.push(...tex2d("emissiveTexture", "emissiveSampler"));
	if (_specGloss) _baseBindings.push(...tex2d("specGlossTexture", "specGlossSampler"));
	if (_esmShadowOutput) _baseBindings.push({
		_name: "shadowParams",
		_type: { _kind: "uniform-buffer" },
		_visibility: STAGE_FRAGMENT
	});
	const posVar = _hasMorph ? "morphedPos" : "position";
	const normVar = _hasMorph ? "morphedNorm" : "normal";
	const _vertexTemplate = `/*SU*/ /*MU*/@group(1)@binding(0)var<uniform>mesh:MeshUniforms; /*VH*/ /*VD*/ /*VO*/@vertex fn main( /*VP*/)->VertexOutput{var out:VertexOutput; /*VR*/var finalWorld=mesh.world; /*VW*/let worldPos4=finalWorld*vec4<f32>(${posVar},1.0);out.worldPos=worldPos4.xyz;out.clipPos=scene.viewProjection*worldPos4;out.worldNormal=(finalWorld*vec4<f32>(normalize(${normVar}),0.0)).xyz;${_tangentNormal ? _tangentNormal.tangentFrameVertex(normVar) : ""} out.uv=uv;${_ext ? _ext.vertexBodyExtra : ""}/*VB*/return out;}`;
	const normalUV = _ext?.uvForNormal ?? "input.uv";
	const normalScaleMod = _ext?.normalScaleMod ?? "";
	const normalRef = _ext?.normalScaleMod ? "scaledNormal" : "normalMapRaw";
	const normalRefCt = _ext?.normalScaleMod ? "scaledNormalCT" : "normalMapSample";
	let normalBlock;
	if (_tangentNormal) normalBlock = _tangentNormal.tangentNormalFragment(normalUV, normalScaleMod, normalRef);
	else if (_cotangentNormal) normalBlock = _cotangentNormal.cotangentNormalFragment(normalUV, normalScaleMod, normalRefCt);
	else if (_flatGeometricNormal && _flatNormalWgsl) normalBlock = `${_flatNormalWgsl}`;
	else normalBlock = `var N_geom=normalize(input.worldNormal);var N=N_geom;`;
	const anisotropyTBBlock = _hasAnisotropy ? _anisoTBBlock : "";
	const vertexColorMod = _ext?.baseColorMod ?? "";
	const baseColorFactorRgb = _hasBaseColorFactor ? "*material.baseColorFactor.rgb" : "";
	const baseColorFactorAlpha = _hasBaseColorFactor ? "*material.baseColorFactor.a" : "";
	const baseColorDecode = _hasGammaAlbedo ? _gammaBaseColor(baseColorFactorRgb, baseColorFactorAlpha, vertexColorMod) : `var baseColor=baseColorSample.rgb${baseColorFactorRgb};var alpha=baseColorSample.a${baseColorFactorAlpha};${vertexColorMod}`;
	const specGlossUV = _ext?.uvForSpecGloss ?? "input.uv";
	const roughnessMetallic = _specGloss ? _specGloss.specGlossRoughness(specGlossUV) : `var roughness=clamp(orm.g*material.roughnessFactor,0.0,1.0);var metallic=orm.b*material.metallicFactor;`;
	const emissiveUV = _ext?.uvForEmissive ?? "input.uv";
	const emissiveDefault = _hasEmissiveColor || !_hasEmissiveTexture ? `var emissive:vec3f;` : `let emissive=textureSample(emissiveTexture,emissiveSampler,${emissiveUV}).rgb;`;
	const occlusionDefault = _hasReflectanceExt ? `` : _ext?.occlusionOverride ? _ext.occlusionOverride : _hasOcclusion ? `var occlusion=orm.r;` : `var occlusion=1.0;`;
	const f0Default = _hasReflectanceExt ? `` : _specGloss ? _specGloss.SPEC_GLOSS_F0 : `let dielectricF0=material.reflectance;var colorF0=mix(vec3<f32>(dielectricF0),baseColor,metallic);let colorF90=vec3<f32>(1.0);var surfaceAlbedo=baseColor*(1.0-dielectricF0)*(1.0-metallic);`;
	const specularAABlock = _hasSpecularAA ? PBR_SPECULAR_AA_WGSL : "";
	const directLightBlock = _hasMultiLight ? _multiLightLoop : _hasSingleLight ? _singleLightBlock : `var directDiffuse=vec3<f32>(0.0);var directSpecular=vec3<f32>(0.0); /*BL*/`;
	const toneMappingHelpersBlock = _hasTonemap ? _toneMappingHelpers : "";
	const tonemapBlock = _hasTonemap ? _toneMappingCall : PBR_EXPOSURE_WGSL;
	const fogHelper = _fogHelper;
	const fogBlock = _fogBlock;
	const alphaBlock = _noColorOutput ? "" : _hasAlphaBlend ? `var finalAlpha=alpha*material.materialAlpha;var luminanceOverAlpha=0.0; /*BA*/luminanceOverAlpha+=dot(${_hasIbl ? `finalSpecularScaled` : `directSpecular`},vec3<f32>(0.2126,0.7152,0.0722));finalAlpha=saturate(finalAlpha+luminanceOverAlpha*luminanceOverAlpha); /*FA*/return vec4<f32>(color,finalAlpha);` : `return vec4<f32>(color,alpha*material.materialAlpha);`;
	const doubleSidedEntry = _hasDoubleSided ? `@fragment fn main(input:FragmentInput,@builtin(front_facing)frontFacing:bool)${_noColorOutput ? "" : " -> @location(0) vec4<f32>"}{` : `@fragment fn main(input:FragmentInput)${_noColorOutput ? "" : " -> @location(0) vec4<f32>"}{`;
	const doubleSidedFlip = _hasDoubleSided ? `if(!frontFacing){N=-N;${_flatGeometricNormal ? "" : " N_geom = -N_geom;"}}` : "";
	const lightBlock = (_hasSingleLight || _hasMultiLight) && !_noColorOutput ? `${_hasMultiLight ? _multiLightWGSL : _singleLightWGSL} @group(0)@binding(1)var<uniform>lights:lightsUniforms;${meshLightIndexWGSL("mesh")}` : "";
	const anisoBrdfBlock = _hasAnisotropy ? _anisoBrdfFunctions : "";
	const fragmentHelpers = _ext?.fragmentHelpers ?? "";
	const fragmentPrelude = _ext?.fragmentPrelude ?? "";
	const baseColorUV = _ext?.uvForBaseColor ?? "input.uv";
	const ormUV = _ext?.uvForOrm ?? "input.uv";
	return {
		_vertexTemplate,
		_fragmentTemplate: `/*SU*/ ${_esmShadowOutput ? "struct shadowParamsUniforms { biasAndScale: vec4<f32>, depthValues: vec4<f32>, }" : ""} /*MU*/@group(1)@binding(0)var<uniform>mesh:MeshUniforms; /*HF*/ /*FB*/ /*FI*/ ${PBR_BRDF_WGSL} ${toneMappingHelpersBlock} ${fogHelper} ${anisoBrdfBlock} ${lightBlock} ${fragmentHelpers} ${doubleSidedEntry} ${fragmentPrelude}/*SV*/let baseColorSample=textureSample(baseColorTexture,baseColorSampler,${baseColorUV});${baseColorDecode} let orm=textureSample(ormTexture,ormSampler,${ormUV}).rgb;${occlusionDefault} ${roughnessMetallic} ${emissiveDefault} /*AT*/ ${_noColorOutput ? "return;" : _esmShadowOutput ? _esmShadowDepthCode : `${normalBlock} ${doubleSidedFlip} ${anisotropyTBBlock} /*AC*/let V=normalize(scene.vEyePosition.xyz-input.worldPos);var NdotVUnclamped=dot(N,V);var NdotV=abs(NdotVUnclamped)+0.0000001;${f0Default} /*MF*/ ${PBR_ROUGHNESS_WGSL} ${specularAABlock} ${directLightBlock} var color=directDiffuse+directSpecular+emissive; /*AI*/ /*NI*/ ${fogBlock} ${tonemapBlock} ${PBR_DISPLAY_OUTPUT_WGSL} /*BC*/ ${alphaBlock}`}}`,
		_baseMeshUboFields,
		_baseMaterialUboFields,
		_baseVertexAttributes,
		_baseVaryings,
		_baseBindings
	};
}
export { createPbrTemplate };

//# sourceMappingURL=pbr-template.js.map