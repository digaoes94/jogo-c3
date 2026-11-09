import { cloneTexture2D } from "../texture/texture-2d.js";
import { getPbrGroupBuilder } from "../material/pbr/pbr-group-builder.js";
import { getGltfBaseColorRgbFactor, uploadBaseColorFactorTexture, uploadOrmFactorTexture, uploadTex } from "./gltf-pbr-builder.js";
// src/loader-gltf/gltf-pbr-builder-ext.ts
/** Stamp `_texCoord=1` on a clone when textureInfo selects UV1 and the
*  wrapTex layer didn't already set it (i.e. scene has no KHR_texture_transform). */
function wrapTexCoord(tex, texInfo) {
	if (!texInfo) return tex;
	if (tex._texCoord === 1) return tex;
	const ti = texInfo;
	return (ti.extensions?.KHR_texture_transform?.texCoord ?? ti.texCoord) === 1 ? cloneTexture2D(tex, { _texCoord: 1 }) : tex;
}
/** True when occlusion shares the ORM image with metallic-roughness but must be sampled
*  with its OWN UV transform — i.e. occlusion references a distinct glTF texture object,
*  or it carries its own KHR_texture_transform that an animation pointer can drive apart
*  from the MR transform. Drives the orm-unpack split in buildDefaultPbrTexturesExt. */
function occlusionNeedsSplit(raw) {
	const occ = raw.occlusionTexture;
	const mr = raw.pbrMetallicRoughness?.metallicRoughnessTexture;
	if (!occ || !mr) return false;
	return occ.index !== mr.index || occ.extensions?.KHR_texture_transform != null;
}
/** Build textures with wrapTex + occlusionOnUv2 support. Mirrors master's
*  default texture building but honors per-textureInfo wrapping so
*  KHR_texture_transform can attach per-texture UV state. Like the fast path, nothing is
*  uploaded for a slot the already-resolved `extLayers` supply — see `buildDefaultPbrTextures`. */
function buildDefaultPbrTexturesExt(engine, mat, sampler, generateMipmaps, getCachedTex, wrapTex, extLayers, samplerFor) {
	const wrap = (tex, ti) => wrapTexCoord(wrapTex(tex, ti), ti);
	const _localCache = samplerFor ? /* @__PURE__ */ new Map() : null;
	const _ids = samplerFor ? /* @__PURE__ */ new Map() : null;
	let _nextId = 0;
	const pickTex = (image, srgb, texInfo) => {
		if (!samplerFor) return getCachedTex(image, srgb);
		const s = samplerFor(texInfo);
		let bySampler = _localCache.get(s);
		if (!bySampler) _localCache.set(s, bySampler = /* @__PURE__ */ new Map());
		let id = _ids.get(image);
		if (id === void 0) _ids.set(image, id = _nextId++);
		const key = id * 2 + (srgb ? 1 : 0);
		let tex = bySampler.get(key);
		if (!tex) {
			tex = uploadTex(engine, image, srgb, s, generateMipmaps);
			bySampler.set(key, tex);
		}
		return tex;
	};
	const coreTex = (image, srgb, ti, supplied) => wrap(supplied ? {
		texture: supplied.texture,
		view: supplied.view,
		sampler: supplied.sampler,
		width: supplied.width,
		height: supplied.height
	} : pickTex(image, srgb, ti), ti);
	const raw = mat._rawMatDef ?? {};
	const pbr = raw.pbrMetallicRoughness ?? {};
	const suppliedOrm = extLayers?.ormTexture;
	const baseColorTexture = mat._baseColorImage ? coreTex(mat._baseColorImage, true, pbr.baseColorTexture, extLayers?.baseColorTexture) : extLayers?.baseColorTexture ? void 0 : uploadBaseColorFactorTexture(engine, mat._baseColorFactor, sampler, generateMipmaps);
	const normalTexture = mat._normalImage ? wrap(pickTex(mat._normalImage, false, raw.normalTexture), raw.normalTexture) : void 0;
	const emissiveTexture = mat._emissiveImage ? wrap(pickTex(mat._emissiveImage, true, raw.emissiveTexture), raw.emissiveTexture) : void 0;
	const occlusionOnUv2 = mat._occlusionTexCoord !== 0 && mat._occlusionImage && !mat._metallicRoughnessImage;
	let occlusionTexture;
	const single = mat._metallicRoughnessImage ?? (occlusionOnUv2 ? null : mat._occlusionImage);
	let ormTexture;
	if (occlusionOnUv2) {
		ormTexture = suppliedOrm ? void 0 : uploadOrmFactorTexture(engine, mat._roughnessFactor, mat._metallicFactor, sampler, generateMipmaps);
		occlusionTexture = wrap(pickTex(mat._occlusionImage, false, raw.occlusionTexture), raw.occlusionTexture);
	} else if (single && (!mat._metallicRoughnessImage || !mat._occlusionImage || mat._metallicRoughnessImage === mat._occlusionImage)) ormTexture = coreTex(single, false, mat._metallicRoughnessImage ? pbr.metallicRoughnessTexture : raw.occlusionTexture, suppliedOrm);
	else if (!single) ormTexture = suppliedOrm ? void 0 : uploadOrmFactorTexture(engine, mat._roughnessFactor, mat._metallicFactor, sampler, generateMipmaps);
	else ormTexture = coreTex(mat._metallicRoughnessImage, false, pbr.metallicRoughnessTexture, suppliedOrm);
	if (!occlusionTexture && mat._occlusionImage && mat._occlusionImage === mat._metallicRoughnessImage && occlusionNeedsSplit(raw)) occlusionTexture = wrap(pickTex(mat._occlusionImage, false, raw.occlusionTexture), raw.occlusionTexture);
	return {
		baseColorTexture,
		ormTexture,
		normalTexture,
		emissiveTexture,
		occlusionTexture
	};
}
/** True when any of this material's textures carries a KHR_texture_transform.
*
*  `_hasTx` is stamped on wrapped textures by gltf-ext-uv-transform, so this is only ever
*  true when that extension actually ran. */
function needsGltfUvTransform(tex) {
	return !!tex.baseColorTexture?._hasTx || !!tex.normalTexture?._hasTx || !!tex.ormTexture?._hasTx || !!tex.emissiveTexture?._hasTx || !!tex.occlusionTexture?._hasTx;
}
/** Registers the uv-transform ext on `props` when any texture carries a
*  KHR_texture_transform.
*
*  `enableMaterialUvTransform` statically imports the uv-transform fragment, so the import has to
*  stay conditional or every scene reaching this slow path pays for it — including scenes
*  that only reach it for occlusion-on-UV2 (scene27/144/243 each paid 721 B).
*
*  The gate and the `import` live here rather than at the call sites so the dynamic-import
*  plumbing is emitted once, into this slow-path chunk, instead of into load-gltf.js and
*  gltf-variants.js. load-gltf.js is fetched by every glTF scene, so a call site there
*  charged ~200 B to fast-path scenes that can never reach this branch (scene41/scene47).
*
*  Must be applied before emissive to keep ext registration order unchanged. */
async function applyGltfUvTransform(props, tex) {
	if (!needsGltfUvTransform(tex)) return;
	const { enableMaterialUvTransform } = await import("../material/pbr/enable-material-uv-transform.js");
	enableMaterialUvTransform(props);
}
/** Slow-path assembly: adds occlusionTexCoord and occlusionTexture props.
*  UV-transform and emissive are applied by the caller — see `applyGltfUvTransform`
*  above and `needsGltfEmissive` in gltf-pbr-builder.ts. */
function assemblePbrPropsExt(mat, tex, extLayers) {
	const baseColorFactor = mat._baseColorImage ? getGltfBaseColorRgbFactor(mat._baseColorFactor) : void 0;
	const tc1 = (t) => t?._texCoord === 1;
	const uv2Mask = (tc1(tex.baseColorTexture) ? 1 : 0) | (tc1(tex.ormTexture) ? 2 : 0) | (tc1(tex.normalTexture) ? 4 : 0) | (tc1(tex.emissiveTexture) ? 8 : 0) | (tc1(extLayers?.specGlossTexture) ? 16 : 0) | (mat._occlusionTexCoord === 1 ? 32 : 0);
	return {
		baseColorTexture: tex.baseColorTexture,
		normalTexture: tex.normalTexture,
		ormTexture: tex.ormTexture,
		emissiveTexture: tex.emissiveTexture,
		...baseColorFactor ? { baseColorFactor } : void 0,
		doubleSided: mat._doubleSided,
		occlusionStrength: mat._occlusionImage ? 1 : 0,
		...mat._occlusionTexCoord ? { occlusionTexCoord: mat._occlusionTexCoord } : void 0,
		...tex.occlusionTexture ? { occlusionTexture: tex.occlusionTexture } : void 0,
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
		...uv2Mask ? { _uv2Mask: uv2Mask } : void 0,
		_buildGroup: getPbrGroupBuilder(),
		_uboVersion: 0
	};
}
export { applyGltfUvTransform, assemblePbrPropsExt, buildDefaultPbrTexturesExt };

//# sourceMappingURL=gltf-pbr-builder-ext.js.map