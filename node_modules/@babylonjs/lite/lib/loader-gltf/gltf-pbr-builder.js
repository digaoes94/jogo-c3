import { U8 } from "../engine/typed-arrays.js";
import { TU } from "../engine/gpu-flags.js";
import { mipLevelCount } from "../texture/mip-count.js";
import { getPbrGroupBuilder } from "../material/pbr/pbr-group-builder.js";
import { linearToSrgbByte } from "../math/color.js";
// src/loader-gltf/gltf-pbr-builder.ts
/** Shared PBR-material assembly + texture upload + ext-layer merging.
*  Used by both the core loader (`load-gltf.ts`) and the variants loader
*  (`gltf-variants.ts`) so they can't drift. */
var identityTexWrap = (tex) => tex;
function uploadTex(engine, bitmap, srgb, sampler, generateMipmaps, fallback) {
	const device = engine._device;
	const w = bitmap?.width ?? 1;
	const h = bitmap?.height ?? 1;
	const fmt = srgb ? "rgba8unorm-srgb" : "rgba8unorm";
	const mips = bitmap ? mipLevelCount(w, h) : 1;
	const tex = device.createTexture({
		size: {
			width: w,
			height: h
		},
		format: fmt,
		usage: TU.TEXTURE_BINDING | TU.COPY_DST | TU.COPY_SRC | TU.RENDER_ATTACHMENT,
		mipLevelCount: mips
	});
	if (bitmap) {
		device.queue.copyExternalImageToTexture({ source: bitmap }, {
			texture: tex,
			premultipliedAlpha: false
		}, {
			width: w,
			height: h
		});
		generateMipmaps(engine, tex);
	} else device.queue.writeTexture({ texture: tex }, fallback ?? new U8([
		255,
		255,
		255,
		255
	]), { bytesPerRow: 4 }, {
		width: 1,
		height: 1
	});
	const result = {
		texture: tex,
		view: tex.createView(),
		sampler,
		width: w,
		height: h
	};
	engine._dlr?.b(result, bitmap, srgb, !!bitmap, fallback);
	return result;
}
function uploadBaseColorFactorTexture(engine, factor, sampler, generateMipmaps) {
	return uploadTex(engine, null, true, sampler, generateMipmaps, new U8([
		linearToSrgbByte(factor[0]),
		linearToSrgbByte(factor[1]),
		linearToSrgbByte(factor[2]),
		255
	]));
}
function uploadOrmFactorTexture(engine, roughness, metallic, sampler, generateMipmaps) {
	const clamp = (value) => Math.round(Math.max(0, Math.min(1, value)) * 255);
	return uploadTex(engine, null, false, sampler, generateMipmaps, new U8([
		255,
		clamp(roughness),
		clamp(metallic),
		255
	]));
}
/** True when a glTF material's `emissiveFactor` describes a real emissive that has to be
*  applied via `setPbrEmissive`.
*
*  Deliberately a standalone predicate rather than logic inside the assemble functions:
*  `setPbrEmissive` statically imports the emissive fragment, so any *static* import of it
*  from this always-loaded module bundles that fragment into every glTF scene, emissive or
*  not. (It did — 74 scenes carried ~513 B of emissive fragment for ~9 real users.) Callers
*  own the conditional `import("../material/pbr/set-emissive.js")`, mirroring how alpha-test
*  and the dielectric extensions are gated.
*
*  `emissiveFactor` multiplies the emissive texture, so [1,1,1] is a no-op WHEN a texture is
*  present. With no emissive texture, [1,1,1] is a real full-white emissive that must be
*  applied (the glTF default is [0,0,0]) — otherwise the surface renders unlit/dark
*  (Material_03). Callers must additionally skip when `props._emissiveColor` is already set:
*  KHR_materials_emissive_strength arrives via `extLayers` having already called the setter
*  with the strength-scaled value, and that takes precedence over the raw factor. */
function needsGltfEmissive(mat, emissiveTexture) {
	const ef = mat._emissiveFactor;
	return !(ef[0] === 0 && ef[1] === 0 && ef[2] === 0 || !!emissiveTexture && ef[0] === 1 && ef[1] === 1 && ef[2] === 1);
}
/** Apply every opt-in PBR feature that is decided purely from glTF material data, after
*  the props have been assembled.
*
*  Each `setPbr*` statically imports its shader fragment, so these imports must stay
*  conditional or every glTF scene pays for features its assets never use. Both the
*  fast path and the slow path, and both the core loader and the variants loader, route
*  through here so a gate cannot be added to one call site and forgotten at another —
*  which is exactly how the variants path lost MASK alpha-discard.
*
*  This lives in the always-loaded shared module rather than the slow-path ext module
*  because a MASK or emissive material can arrive on either path; hoisting it into
*  `gltf-pbr-builder-ext.ts` would drag that chunk onto fast-path scenes. UV-transform
*  is the opposite case — slow-path only — so its gate stays in `applyGltfUvTransform`. */
async function applyGltfOptInPbrFeatures(props, mat) {
	if (!props._emissiveColor && needsGltfEmissive(mat, props.emissiveTexture)) {
		const { setPbrEmissive } = await import("../material/pbr/set-emissive.js");
		const ef = mat._emissiveFactor;
		setPbrEmissive(props, [
			ef[0],
			ef[1],
			ef[2]
		]);
	}
	if (mat._alphaMode === "MASK") {
		const { setPbrAlphaCutoff } = await import("../material/pbr/set-alpha-cutoff.js");
		setPbrAlphaCutoff(props, mat._alphaCutoff);
	}
	mat._onMaterialCreated?.(props);
}
/** Assemble a PbrMaterialProps from parsed glTF material data + already-uploaded
*  textures + per-ext fragment overrides. Fast-path: no wrapTex, no occlusionOnUv2,
*  no occlusionTexture. Slow-path additions live in gltf-pbr-builder-ext.ts.
*  Emissive is applied by the caller — see `needsGltfEmissive`. */
function assemblePbrProps(mat, baseColorTexture, ormTexture, normalTexture, emissiveTexture, extLayers) {
	const baseColorFactor = mat._baseColorImage ? getGltfBaseColorRgbFactor(mat._baseColorFactor) : void 0;
	return {
		baseColorTexture,
		normalTexture,
		ormTexture,
		emissiveTexture,
		...baseColorFactor ? { baseColorFactor } : void 0,
		doubleSided: mat._doubleSided,
		occlusionStrength: mat._occlusionImage ? 1 : 0,
		...mat._normalScale !== 1 ? { normalTextureScale: mat._normalScale } : void 0,
		...mat._metallicRoughnessImage ? {
			metallicFactor: mat._metallicFactor,
			roughnessFactor: mat._roughnessFactor
		} : void 0,
		enableSpecularAA: true,
		...mat._alphaMode === "BLEND" ? {
			alphaBlend: true,
			alpha: mat._baseColorFactor[3]
		} : void 0,
		...mat._alphaMode === "MASK" ? { alpha: mat._baseColorFactor[3] } : void 0,
		...mat._rawMatDef?.name ? { name: mat._rawMatDef.name } : void 0,
		...extLayers,
		_buildGroup: getPbrGroupBuilder(),
		_uboVersion: 0
	};
}
/** BLEND/MASK already carry factor alpha in material.alpha; only RGB belongs here. */
function getGltfBaseColorRgbFactor(f) {
	return f[0] !== 1 || f[1] !== 1 || f[2] !== 1 ? [
		f[0],
		f[1],
		f[2],
		1
	] : void 0;
}
/** Build the default textures (base color + ORM) from a parsed glTF material.
*  Fast-path version: no wrapTex, no occlusion-on-uv2 handling. The slow path lives
*  in gltf-pbr-builder-ext.ts and is lazy-loaded only when needed.
*
*  `extLayers` are the material features' fragments, resolved first. A slot they supply — base
*  color from KHR_texture_basisu or KHR_materials_pbrSpecularGlossiness, ORM from ORM compositing
*  or KHR_texture_basisu — wins in assembly, so nothing is uploaded for it (neither the core image
*  nor the 1×1 factor fallback) and it is returned `undefined`. An upload made anyway would be
*  unreachable from every material, so no release would ever destroy it. */
function buildDefaultPbrTextures(engine, mat, sampler, generateMipmaps, getCachedTex, extLayers) {
	const baseColorTexture = extLayers?.baseColorTexture ? void 0 : mat._baseColorImage ? getCachedTex(mat._baseColorImage, true) : uploadBaseColorFactorTexture(engine, mat._baseColorFactor, sampler, generateMipmaps);
	const normalTexture = mat._normalImage ? getCachedTex(mat._normalImage, false) : void 0;
	const emissiveTexture = mat._emissiveImage ? getCachedTex(mat._emissiveImage, true) : void 0;
	const single = mat._metallicRoughnessImage ?? mat._occlusionImage;
	let ormTexture;
	if (extLayers?.ormTexture) ormTexture = void 0;
	else if (single && (!mat._metallicRoughnessImage || !mat._occlusionImage || mat._metallicRoughnessImage === mat._occlusionImage)) ormTexture = getCachedTex(single, false);
	else if (!single) ormTexture = uploadOrmFactorTexture(engine, mat._roughnessFactor, mat._metallicFactor, sampler, generateMipmaps);
	else ormTexture = getCachedTex(mat._metallicRoughnessImage, false);
	return {
		baseColorTexture,
		ormTexture,
		normalTexture,
		emissiveTexture
	};
}
export { applyGltfOptInPbrFeatures, assemblePbrProps, buildDefaultPbrTextures, getGltfBaseColorRgbFactor, identityTexWrap, needsGltfEmissive, uploadBaseColorFactorTexture, uploadOrmFactorTexture, uploadTex };

//# sourceMappingURL=gltf-pbr-builder.js.map