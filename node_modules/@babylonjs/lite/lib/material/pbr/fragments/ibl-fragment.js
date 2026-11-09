import { pbrDiffuseOcclusion } from "../pbr-diffuse-occlusion.js";
import { _rightHanded } from "#coordinate-system";
// src/material/pbr/fragments/ibl-fragment.ts
var STAGE_FRAGMENT = 2;
var IBL_HELPERS = `fn environmentHorizonOcclusion(V:vec3<f32>,N:vec3<f32>,geoN:vec3<f32>)->f32{let R=reflect(V,N);let temp=saturate(1.0+1.1*dot(R,geoN));return temp*temp;}fn getEnergyConservationFactor(F0:vec3<f32>,brdfY:f32)->vec3<f32>{return 1.0+F0*(1.0/brdfY-1.0);}fn rotateY(v:vec3<f32>,angle:f32)->vec3<f32>{let c=cos(angle);let s=sin(angle);return vec3<f32>(v.x*c+v.z*s,v.y,${_rightHanded ? "v.x*s-v.z*c" : "-v.x*s+v.z*c"});}`;
/**
* Create an IBL/environment fragment.
* @param hasNormalMap - Whether the material uses a normal map (enables horizon occlusion).
* @param anisoBentNormalCode - WGSL code for anisotropic bent normal (empty string = standard reflection).
* @param skyboxCalculation - Pre-baked skybox-mode WGSL from ibl-skybox-wgsl.ts (empty string = normal PBR).
* @param diffuseOcclusion - Typed diffuse-only visibility expression.
*/
function createIblFragment(hasNormalMap, anisoBentNormalCode = ``, skyboxCalculation = ``, diffuseOcclusion = `occlusion`) {
	let calculation = skyboxCalculation;
	if (!calculation) calculation = `${anisoBentNormalCode ? anisoBentNormalCode : `let R_raw=reflect(-V,N);`} let R=rotateY(R_raw,scene.envRotationY);let N_env=rotateY(N,scene.envRotationY);let brdf=textureSample(brdfLUT,brdfSampler_,vec2<f32>(NdotV,roughness));let environmentBrdf=brdf.rgb;let specularEnvironmentReflectance=(colorF90-colorF0)*environmentBrdf.x+colorF0*environmentBrdf.y;let seo=clamp((NdotVUnclamped+occlusion)*(NdotVUnclamped+occlusion)-1.0+occlusion,0.0,1.0);${hasNormalMap ? `let eho=environmentHorizonOcclusion(-V,N,N_geom);` : `let eho=1.0;`} let colorSpecularEnvReflectance=specularEnvironmentReflectance*seo*eho;let energyConservation=getEnergyConservationFactor(colorF0,max(environmentBrdf.y,0.001));let environmentIrradiance=(scene.vSphericalL00.rgb+scene.vSphericalL1_1.rgb*N_env.y+scene.vSphericalL10.rgb*N_env.z+scene.vSphericalL11.rgb*N_env.x+scene.vSphericalL2_2.rgb*(N_env.y*N_env.x)+scene.vSphericalL2_1.rgb*(N_env.y*N_env.z)+scene.vSphericalL20.rgb*(3.0*N_env.z*N_env.z-1.0)+scene.vSphericalL21.rgb*(N_env.z*N_env.x)+scene.vSphericalL22.rgb*(N_env.x*N_env.x-N_env.y*N_env.y))*material.environmentIntensity; let maxLod=f32(textureNumLevels(iblTexture)-1);let cubemapDim=f32(textureDimensions(iblTexture).x);var specLod=log2(cubemapDim*alphaG)*scene.vImageInfos.z;var environmentRadiance=textureSampleLevel(iblTexture,iblSampler,R,clamp(specLod,0.0,maxLod)).rgb*material.environmentIntensity;environmentRadiance=mix(environmentRadiance,environmentIrradiance,alphaG);let finalIrradiance=environmentIrradiance*surfaceAlbedo* ${diffuseOcclusion};let finalSpecularScaled=directSpecular*energyConservation;let finalRadianceScaled=environmentRadiance*colorSpecularEnvReflectance*energyConservation;color=finalIrradiance+finalRadianceScaled+finalSpecularScaled+directDiffuse+emissive;`;
	return {
		_id: "ibl",
		_bindings: [
			{
				_name: "brdfLUT",
				_type: {
					_kind: "texture",
					_textureType: "texture_2d<f32>"
				},
				_visibility: STAGE_FRAGMENT
			},
			{
				_name: "brdfSampler_",
				_type: {
					_kind: "sampler",
					_samplerType: "sampler"
				},
				_visibility: STAGE_FRAGMENT
			},
			{
				_name: "iblTexture",
				_type: {
					_kind: "texture",
					_textureType: "texture_cube<f32>"
				},
				_visibility: STAGE_FRAGMENT
			},
			{
				_name: "iblSampler",
				_type: {
					_kind: "sampler",
					_samplerType: "sampler"
				},
				_visibility: STAGE_FRAGMENT
			}
		],
		_helperFunctions: IBL_HELPERS,
		_fragmentSlots: {
			AI: calculation,
			BA: `luminanceOverAlpha+=dot(finalRadianceScaled,vec3<f32>(0.2126,0.7152,0.0722));`
		}
	};
}
var pbrExt = {
	id: "ibl",
	phase: "ibl",
	frag(ctx) {
		if (!ctx._hasIbl) return null;
		return createIblFragment(ctx._hasAnyNormal, ctx._anisoBentNormalCode, ctx._iblSkyboxCalc, ctx._iblSkyboxCalc ? void 0 : pbrDiffuseOcclusion?.(ctx._pi ?? 0, ctx._features, ctx._features2) ?? void 0);
	},
	bind(ctx, entries, b) {
		if (!ctx._env) return b;
		entries.push({
			binding: b++,
			resource: ctx._env.brdfLutView
		});
		entries.push({
			binding: b++,
			resource: ctx._env.brdfSampler
		});
		entries.push({
			binding: b++,
			resource: ctx._env.specularCubeView
		});
		entries.push({
			binding: b++,
			resource: ctx._env.cubeSampler
		});
		return b;
	}
};
export { createIblFragment, pbrExt };

//# sourceMappingURL=ibl-fragment.js.map