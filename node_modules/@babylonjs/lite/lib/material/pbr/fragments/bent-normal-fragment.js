import "../../mesh-features.js";
import "../pbr-flag-bits.js";
import { pbrExt } from "./ibl-fragment.js";
import { _rightHanded } from "#coordinate-system";
// src/material/pbr/fragments/bent-normal-fragment.ts
var STAGE_FRAGMENT = 2;
var PBR_HAS_BENT_NORMAL = 16;
var UV2_MASK_NORMAL = 4;
var BENT_NORMAL_HELPERS = `fn bentNormalSGOverlap(d2in:f32,spread:f32,rs:f32)->f32{let d2=clamp(d2in,0.0,4.0);let sp=spread*rs;let sd=spread-rs;let pl=sqrt(sd*sd+sp*(4.0-d2));let e=-d2/max(pl+spread+rs,1e-30);let x=2.0*pl/max(sp,1e-30);var o=spread*(1.0-exp(-x))/max(pl,1e-30);if(x<0.01){o=2.0*spread/max(sp,1e-30)*(1.0-x*(0.5-x/6.0));}return exp(e)*o;}fn bentNormalSGOcclusion(bd2:f32,nd2:f32,NdotV:f32,ao:f32,alphaG:f32)->f32{let v=saturate(ao);let cc=sqrt(1.0-v);let vs=v/(1.0+cc);let rs=2.0*alphaG*alphaG*saturate(NdotV);return min(1.0,bentNormalSGOverlap(bd2,vs,rs)/bentNormalSGOverlap(nd2,1.0,rs));}fn environmentBentNormalOcclusion(bent:vec3<f32>,R:vec3<f32>,n:vec3<f32>,NdotV:f32,ao:f32,alphaG:f32)->f32{let v=saturate(ao);if(v==0.0||v==1.0){return v;}let cs=sqrt(v);let c=dot(bent,n);var axis=bent;if(c<cs){let t=bent-c*n;let tl=length(t);axis=n;if(tl>1e-6){axis=cs*n+sqrt(1.0-v)*t/tl;}}let bd=axis-R;let nd=n-R;return bentNormalSGOcclusion(dot(bd,bd),dot(nd,nd),NdotV,v,alphaG);}`;
/**
* Create the bent-normal fragment.
* @param reuseTbn - Reuse the template's vertex `TBN` (tangent normal mode, no thin instances).
* @param doubleSided - Material is double-sided (`frontFacing` is in scope).
*/
function createBentNormalFragment(reuseTbn, doubleSided) {
	return {
		_id: "bent-normal",
		_uboFields: [{
			_name: "bentNormalParams",
			_type: "vec4<f32>"
		}],
		_bindings: [{
			_name: "bentNormalTexture_",
			_type: {
				_kind: "texture",
				_textureType: "texture_2d<f32>"
			},
			_visibility: STAGE_FRAGMENT
		}, {
			_name: "bentNormalSampler_",
			_type: {
				_kind: "sampler",
				_samplerType: "sampler"
			},
			_visibility: STAGE_FRAGMENT
		}],
		_helperFunctions: BENT_NORMAL_HELPERS,
		_fragmentSlots: { AC: `${reuseTbn ? `let bnTBN=TBN;` : `let bnUV=${doubleSided ? "select(-input.uv,input.uv,frontFacing)" : "input.uv"};let bnDp1=dpdx(input.worldPos);let bnDp2=dpdy(input.worldPos);let bnDuv1=dpdx(bnUV);let bnDuv2=dpdy(bnUV);let bnDp2p=cross(bnDp2,N_geom);let bnDp1p=cross(N_geom,bnDp1);let bnT=${_rightHanded ? "-(bnDp2p*bnDuv1.x+bnDp1p*bnDuv2.x)" : "bnDp2p*bnDuv1.x+bnDp1p*bnDuv2.x"};let bnB=${_rightHanded ? "bnDp2p*bnDuv1.y+bnDp1p*bnDuv2.y" : "-(bnDp2p*bnDuv1.y+bnDp1p*bnDuv2.y)"};let bnDet=max(dot(bnT,bnT),dot(bnB,bnB));let bnInv=select(inverseSqrt(bnDet),0.0,bnDet==0.0);let bnTBN=mat3x3<f32>(bnT*bnInv,bnB*bnInv,N_geom);`} var bentNormalW=normalize(bnTBN*(textureSample(bentNormalTexture_,bentNormalSampler_,input.uv).rgb*2.0-1.0));${reuseTbn && doubleSided ? "if(!frontFacing){bentNormalW=-bentNormalW;}" : ""} let bentNormalStrength=saturate(material.bentNormalParams.x);` }
	};
}
/**
* Patch the IBL calculation for bent normals (BJS: `RADIANCEOCCLUSION && !BENTNORMAL`
* drops `seo` from colorSpecularEnvironmentReflectance, then finalRadiance is scaled by
* the SG cone occlusion). The search strings are template literals so the bundle WGSL
* minifier rewrites them exactly like the IBL source. Skybox materials never get here
* (gated in `detect`).
*/
function patchIblCalculation(ai) {
	return ai.replace(`specularEnvironmentReflectance*seo*eho`, `specularEnvironmentReflectance*eho`).replace(`colorSpecularEnvReflectance*energyConservation`, `colorSpecularEnvReflectance*mix(1.0,environmentBentNormalOcclusion(bentNormalW,R_raw,N,NdotVUnclamped,occlusion,alphaG),bentNormalStrength)*energyConservation`);
}
/**
* Enable bent-normal reflection occlusion (`PbrMaterialProps.bentNormalTexture`).
*
* Explicit opt-in so scenes without bent normals carry zero bent-normal bytes: nothing
* in the always-fetched engine graph references this module. It installs the bent-normal
* hooks onto the IBL extension (merging into the IBL fragment), so the pre-existing
* IBL registration in the PBR build picks them up. Idempotent and global.
*
* Call BEFORE `registerScene(scene)` (or before any PBR material is first built).
* Requires an environment (IBL); materials also need an ambient occlusion texture
* (`ormTexture` or `occlusionTexture`), matching Babylon.js.
*
* @example
* ```ts
* mat.bentNormalTexture = await loadTexture2D(engine, url, { invertY: false });
* enableBentNormals();
* await registerScene(scene);
* ```
*/
function enableBentNormals() {
	const ext = pbrExt;
	if (ext.detect) return;
	const iblFrag = ext.frag;
	const iblBind = ext.bind;
	ext.detect = (mat) => {
		const m = mat;
		return {
			f: m.bentNormalTexture && !m._unlit && !m._skyboxMode && (m.ormTexture || m.occlusionTexture) && (m.occlusionStrength ?? 1) > 0 ? PBR_HAS_BENT_NORMAL : 0,
			f2: 0
		};
	};
	ext.frag = (ctx) => {
		const ibl = iblFrag(ctx);
		if (!ibl || !(ctx._features & PBR_HAS_BENT_NORMAL)) return ibl;
		const bent = createBentNormalFragment((ctx._features & 1) !== 0 && (ctx._meshFeatures & 1) !== 0 && (ctx._meshFeatures & 16) === 0 && (ctx._features2 & 512) === 0 && ((ctx._uv2Mask ?? 0) & UV2_MASK_NORMAL) === 0, (ctx._features & 256) !== 0);
		return {
			...ibl,
			_uboFields: bent._uboFields,
			_bindings: [...ibl._bindings, ...bent._bindings],
			_helperFunctions: ibl._helperFunctions + bent._helperFunctions,
			_fragmentSlots: {
				...ibl._fragmentSlots,
				...bent._fragmentSlots,
				AI: patchIblCalculation(ibl._fragmentSlots.AI)
			}
		};
	};
	ext.writeUbo = (data, mat, offsets) => {
		const off = offsets.get("bentNormalParams");
		if (off !== void 0) data[off / 4] = mat.bentNormalStrength ?? 1;
	};
	ext.bind = (ctx, entries, b) => {
		b = iblBind(ctx, entries, b);
		const t = ctx._material.bentNormalTexture;
		if (t && ctx._env && ctx._features & PBR_HAS_BENT_NORMAL) {
			entries.push({
				binding: b++,
				resource: t.view
			});
			entries.push({
				binding: b++,
				resource: t.sampler
			});
		}
		return b;
	};
	ext.textures = (mat, out) => {
		const t = mat.bentNormalTexture;
		if (t) out.push(t);
	};
}
export { createBentNormalFragment, enableBentNormals };

//# sourceMappingURL=bent-normal-fragment.js.map