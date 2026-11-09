import { getOrCreateSampler } from "../resource/sampler-pool.js";
import { uploadBaseColorFactorTexture, uploadOrmFactorTexture } from "./gltf-pbr-builder.js";
// src/loader-gltf/gltf-sampler-desc.ts
/** Map a glTF textureInfo's sampler (wrapS/wrapT/magFilter/minFilter) to a WebGPU sampler
*  descriptor. glTF wrap: 33071 CLAMP_TO_EDGE, 33648 MIRRORED_REPEAT, else REPEAT.
*  glTF filter: 9728 NEAREST else LINEAR; min/mip from the combined min filter enum. */
function gltfTexSamplerDesc(json, texInfo) {
	const s = json.textures?.[texInfo.index]?.sampler != null ? json.samplers?.[json.textures[texInfo.index].sampler] : void 0;
	const wrap = (m) => m === 33071 ? "clamp-to-edge" : m === 33648 ? "mirror-repeat" : "repeat";
	const minF = s?.minFilter;
	const minNearest = !!minF && minF % 2 === 0;
	const mipNearest = minF === 9984 || minF === 9985;
	const noMip = minF === 9728 || minF === 9729;
	const magLinear = s?.magFilter !== 9728;
	return {
		magFilter: magLinear ? "linear" : "nearest",
		minFilter: minNearest ? "nearest" : "linear",
		mipmapFilter: mipNearest ? "nearest" : "linear",
		addressModeU: wrap(s?.wrapS),
		addressModeV: wrap(s?.wrapT),
		...noMip ? { lodMaxClamp: 0 } : void 0,
		maxAnisotropy: magLinear && !minNearest && !mipNearest && !noMip ? 4 : 1
	};
}
/** Build a per-texture sampler resolver honoring each texture's glTF sampler
*  (wrap/filter). Loaded lazily only when an asset declares a non-default sampler;
*  the common case (default repeat/linear) uses one shared sampler and never loads this.
*  `texInfo == null` (factor textures) falls back to `defaultSampler`.
*  @internal */
function makeSamplerFor(engine, json, defaultSampler) {
	return (texInfo) => {
		if (texInfo == null) return defaultSampler;
		const desc = gltfTexSamplerDesc(json, texInfo);
		const sampler = getOrCreateSampler(engine, desc);
		engine._deviceLostRecovery?._samplerDescriptors.set(sampler, desc);
		return sampler;
	};
}
/** Sampler-aware variant of buildDefaultPbrTextures. Mirrors the core fast path but wraps
*  each shared GPU texture with the sampler resolved from its glTF textureInfo (wrap/filter),
*  so clamp/mirror/nearest assets render correctly without re-uploading identical images.
*  Lazy-loaded only for non-default-sampler assets — the common path stays byte-identical.
*  @internal */
function buildSampledPbrTextures(engine, mat, defaultSampler, generateMipmaps, samplerFor, getCachedTex, extLayers) {
	const def = mat._rawMatDef ?? {};
	const pbr = def.pbrMetallicRoughness ?? {};
	const cached = (bitmap, srgb, texInfo) => {
		const s = samplerFor(texInfo);
		const tex = getCachedTex(bitmap, srgb);
		if (s === defaultSampler) return tex;
		const derived = {
			...tex,
			sampler: s
		};
		engine._dlr?.d(tex, derived);
		return derived;
	};
	const baseColorTexture = extLayers?.baseColorTexture ? void 0 : mat._baseColorImage ? cached(mat._baseColorImage, true, pbr.baseColorTexture) : uploadBaseColorFactorTexture(engine, mat._baseColorFactor, defaultSampler, generateMipmaps);
	const normalTexture = mat._normalImage ? cached(mat._normalImage, false, def.normalTexture) : void 0;
	const emissiveTexture = mat._emissiveImage ? cached(mat._emissiveImage, true, def.emissiveTexture) : void 0;
	const single = mat._metallicRoughnessImage ?? mat._occlusionImage;
	const ormTexInfo = mat._metallicRoughnessImage ? pbr.metallicRoughnessTexture : def.occlusionTexture;
	let ormTexture;
	if (extLayers?.ormTexture) ormTexture = void 0;
	else if (single && (!mat._metallicRoughnessImage || !mat._occlusionImage || mat._metallicRoughnessImage === mat._occlusionImage)) ormTexture = cached(single, false, ormTexInfo);
	else if (!single) ormTexture = uploadOrmFactorTexture(engine, mat._roughnessFactor, mat._metallicFactor, defaultSampler, generateMipmaps);
	else ormTexture = cached(mat._metallicRoughnessImage, false, pbr.metallicRoughnessTexture);
	return {
		baseColorTexture,
		ormTexture,
		normalTexture,
		emissiveTexture
	};
}
export { buildSampledPbrTextures, makeSamplerFor };

//# sourceMappingURL=gltf-sampler-desc.js.map