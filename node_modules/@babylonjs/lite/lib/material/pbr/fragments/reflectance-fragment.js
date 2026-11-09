import { PBR2_HAS_REFLECTANCE_FACTORS, PBR_HAS_METALLIC_REFLECTANCE_MAP, PBR_HAS_REFLECTANCE_MAP, PBR_HAS_USE_ALPHA_ONLY_MR } from "../pbr-flag-bits.js";
// src/material/pbr/fragments/reflectance-fragment.ts
var PBR2_REFL_UV_TX = 1 << 26;
var STAGE_FRAGMENT = 2;
var reflUvExpr = (name) => `(vec2<f32>(dot(material.${name}m.xy,input.uv),dot(material.${name}m.zw,input.uv))+material.${name}t.xy)`;
/** Write a 2x2 UV matrix (vec4) + translate (vec4) for a reflectance texture. */
function writeReflUvTransform(data, offsets, name, tex) {
	const mOff = offsets.get(`${name}m`);
	const tOff = offsets.get(`${name}t`);
	if (mOff === void 0 || tOff === void 0) return;
	const sx = tex?.uScale ?? 1;
	const sy = tex?.vScale ?? 1;
	const ang = tex?.uAng ?? 0;
	const mi = mOff / 4;
	if (ang === 0) {
		data[mi] = sx;
		data[mi + 1] = 0;
		data[mi + 2] = 0;
		data[mi + 3] = sy;
	} else {
		const c = Math.cos(ang);
		const s = Math.sin(ang);
		data[mi] = c * sx;
		data[mi + 1] = s * sy;
		data[mi + 2] = -s * sx;
		data[mi + 3] = c * sy;
	}
	const ti = tOff / 4;
	data[ti] = tex?.uOffset ?? 0;
	data[ti + 1] = tex?.vOffset ?? 0;
}
/** Write the reflectance-extension material-UBO slice
*  (occlusionStrength, metallicF0Factor, specularWeight, metallicReflectanceColor).
*  Gated by the presence of the `occlusionStrength` field in the UBO spec,
*  which is added only when a metallic-reflectance or reflectance texture
*  is in use. */
function writeReflectanceUBO(data, material, offsets) {
	if (!offsets.has("occlusionStrength")) return;
	const off = offsets.get("occlusionStrength") / 4;
	data[off] = material.occlusionStrength ?? 1;
	data[off + 1] = material._metallicF0Factor ?? 1;
	data[off + 2] = material._specularWeight ?? material._metallicF0Factor ?? 1;
	const mrc = material._metallicReflectanceColor;
	data[off + 4] = mrc ? mrc[0] : 1;
	data[off + 5] = mrc ? mrc[1] : 1;
	data[off + 6] = mrc ? mrc[2] : 1;
	writeReflUvTransform(data, offsets, "reflUV", material._reflectanceTexture);
	writeReflUvTransform(data, offsets, "mrReflUV", material._metallicReflectanceTexture);
}
/**
* Create a metallic reflectance fragment.
* @param hasMetallicReflectanceMap - Whether the material has a metallicReflectanceTexture.
* @param hasReflectanceMap - Whether the material has a reflectanceTexture.
* @param useAlphaOnlyMR - Whether to use only the alpha channel from the metallic reflectance map.
*/
function createReflectanceFragment(hasMetallicReflectanceMap, hasReflectanceMap, useAlphaOnlyMR, hasOcclusionUv2 = false, hasUvTx = false, hasOcclusionSplit = false) {
	const occlusionSample = hasOcclusionUv2 ? "textureSample(occlusionTexture, occlusionSampler_, input.uv2).r" : hasOcclusionSplit ? "textureSample(ormTexture,ormSampler,occlUV).r" : "orm.r";
	const bindings = [];
	if (hasMetallicReflectanceMap) bindings.push({
		_name: "metallicReflectanceMap",
		_type: {
			_kind: "texture",
			_textureType: "texture_2d<f32>"
		},
		_visibility: STAGE_FRAGMENT
	}, {
		_name: "metallicReflectanceMapSampler",
		_type: {
			_kind: "sampler",
			_samplerType: "sampler"
		},
		_visibility: STAGE_FRAGMENT
	});
	if (hasReflectanceMap) bindings.push({
		_name: "reflectanceMap",
		_type: {
			_kind: "texture",
			_textureType: "texture_2d<f32>"
		},
		_visibility: STAGE_FRAGMENT
	}, {
		_name: "reflectanceMapSampler",
		_type: {
			_kind: "sampler",
			_samplerType: "sampler"
		},
		_visibility: STAGE_FRAGMENT
	});
	const reflUv = hasUvTx ? reflUvExpr("reflUV") : "input.uv";
	const mrReflUv = hasUvTx ? reflUvExpr("mrReflUV") : "input.uv";
	let f0Code = `var mrFactors=vec4<f32>(material.metallicReflectanceColor,material.metallicF0Factor);var specularWeight=material.specularWeight;`;
	if (hasReflectanceMap) f0Code = `${f0Code}{let rSample=textureSample(reflectanceMap,reflectanceMapSampler,${reflUv});let rLinear=pow(rSample.rgb,vec3<f32>(2.2));mrFactors=vec4<f32>(mrFactors.rgb*rLinear,mrFactors.a);}`;
	if (hasMetallicReflectanceMap) {
		if (!useAlphaOnlyMR) f0Code = `${f0Code}{let mrSample=textureSample(metallicReflectanceMap,metallicReflectanceMapSampler,${mrReflUv});let mrLinear=pow(mrSample.rgb,vec3<f32>(2.2));mrFactors=vec4<f32>(mrFactors.rgb*mrLinear,mrFactors.a*mrSample.a);specularWeight*=mrSample.a;}`;
		else f0Code = `${f0Code}{let mrSample=textureSample(metallicReflectanceMap,metallicReflectanceMapSampler,${mrReflUv});mrFactors=vec4<f32>(mrFactors.rgb,mrFactors.a*mrSample.a);specularWeight*=mrSample.a;}`;
	}
	f0Code = `${f0Code} let dielectricF0=material.reflectance*mrFactors.a;let surfaceReflectivityColor=mrFactors.rgb;let dielectricColorF0=vec3<f32>(dielectricF0)*surfaceReflectivityColor;let metallicColorF0=baseColor;var colorF0=mix(dielectricColorF0,metallicColorF0,metallic);let colorF90=vec3<f32>(mix(specularWeight,1.0,metallic));let surfaceAlbedo=baseColor*(vec3<f32>(1.0)-vec3<f32>(dielectricF0)*surfaceReflectivityColor)*(1.0-metallic);`;
	const uboFields = [
		{
			_name: "occlusionStrength",
			_type: "f32"
		},
		{
			_name: "metallicF0Factor",
			_type: "f32"
		},
		{
			_name: "specularWeight",
			_type: "f32"
		},
		{
			_name: "_mrPad1",
			_type: "f32"
		},
		{
			_name: "metallicReflectanceColor",
			_type: "vec3<f32>"
		},
		{
			_name: "_mrPad2",
			_type: "f32"
		}
	];
	if (hasUvTx) {
		if (hasReflectanceMap) uboFields.push({
			_name: "reflUVm",
			_type: "vec4<f32>"
		}, {
			_name: "reflUVt",
			_type: "vec4<f32>"
		});
		if (hasMetallicReflectanceMap) uboFields.push({
			_name: "mrReflUVm",
			_type: "vec4<f32>"
		}, {
			_name: "mrReflUVt",
			_type: "vec4<f32>"
		});
	}
	return {
		_id: hasUvTx ? "reflectance-U" : "reflectance",
		_uboFields: uboFields,
		_bindings: bindings,
		_fragmentSlots: {
			MF: f0Code,
			AT: `var occlusion=mix(1.0,${occlusionSample},material.occlusionStrength);`
		}
	};
}
/** Create the reflectance PBR extension (group 1, fragment phase). */
var pbrExt = {
	id: "reflectance",
	phase: "fragment",
	detect(mat) {
		const m = mat;
		let f = 0;
		let f2 = 0;
		if (m._metallicReflectanceTexture) f |= PBR_HAS_METALLIC_REFLECTANCE_MAP;
		if (m._reflectanceTexture) f |= PBR_HAS_REFLECTANCE_MAP;
		if (f === 0) {
			const hasNonDefaultF0 = m._metallicF0Factor != null && Math.abs(m._metallicF0Factor - 1) > 1e-6;
			const mrc = m._metallicReflectanceColor;
			const hasNonDefaultColor = mrc != null && (mrc[0] !== 1 || mrc[1] !== 1 || mrc[2] !== 1);
			if (hasNonDefaultF0 || hasNonDefaultColor || m._occlStrengthAnimated) f2 |= PBR2_HAS_REFLECTANCE_FACTORS;
		}
		if ((f !== 0 || f2 & 1024) && m._useOnlyMetallicFromMetallicReflectanceTexture) f |= PBR_HAS_USE_ALPHA_ONLY_MR;
		const refHasTx = (t) => !!t?._hasTx;
		if (f !== 0 && (refHasTx(m._reflectanceTexture) || refHasTx(m._metallicReflectanceTexture))) f2 |= PBR2_REFL_UV_TX;
		return {
			f,
			f2
		};
	},
	frag(ctx) {
		const hasMR = (ctx._features & PBR_HAS_METALLIC_REFLECTANCE_MAP) !== 0;
		const hasR = (ctx._features & PBR_HAS_REFLECTANCE_MAP) !== 0;
		const hasFactors = (ctx._features2 & PBR2_HAS_REFLECTANCE_FACTORS) !== 0;
		if (!hasMR && !hasR && !hasFactors) return null;
		return createReflectanceFragment(hasMR, hasR, (ctx._features & PBR_HAS_USE_ALPHA_ONLY_MR) !== 0, ((ctx._uv2Mask ?? 0) & 32) !== 0, (ctx._features2 & PBR2_REFL_UV_TX) !== 0, (ctx._features2 & 512) !== 0 && (ctx._features2 & 1 << 28) !== 0);
	},
	writeUbo: writeReflectanceUBO,
	bind(ctx, entries, b) {
		if ((ctx._features & 3072) === 0) return b;
		const m = ctx._material;
		if (m._metallicReflectanceTexture) {
			entries.push({
				binding: b++,
				resource: m._metallicReflectanceTexture.view
			});
			entries.push({
				binding: b++,
				resource: m._metallicReflectanceTexture.sampler
			});
		}
		if (m._reflectanceTexture) {
			entries.push({
				binding: b++,
				resource: m._reflectanceTexture.view
			});
			entries.push({
				binding: b++,
				resource: m._reflectanceTexture.sampler
			});
		}
		return b;
	},
	textures(mat, t) {
		const m = mat;
		if (m._metallicReflectanceTexture) t.push(m._metallicReflectanceTexture);
		if (m._reflectanceTexture) t.push(m._reflectanceTexture);
	}
};
export { createReflectanceFragment, pbrExt, writeReflectanceUBO };

//# sourceMappingURL=reflectance-fragment.js.map