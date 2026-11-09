import { getTextureImageIndex, resolveImage } from "./gltf-parser.js";
// src/loader-gltf/gltf-material.ts
/** Assemble core PBR material data from a glTF material definition.
*
*  Per-material extension parsing/fetching is handled by load-gltf.ts using
*  the GltfMatExt registry — this function only fills in the spec-baseline
*  PBR properties shared by every material. */
async function assembleMaterial(json, binChunk, materialIdx, baseUrl, imageCache) {
	const rawMat = json.materials?.[materialIdx];
	const mat = rawMat ?? {};
	const pbr = mat.pbrMetallicRoughness ?? {};
	const fetchImg = makeImageFetcher(json, binChunk, baseUrl, imageCache);
	const [baseColorImg, mrImg, normalImg, occlusionImg, emissiveImg] = await Promise.all([
		fetchImg(pbr.baseColorTexture),
		fetchImg(pbr.metallicRoughnessTexture),
		fetchImg(mat.normalTexture),
		fetchImg(mat.occlusionTexture),
		fetchImg(mat.emissiveTexture)
	]);
	return {
		_baseColorFactor: pbr.baseColorFactor ?? [
			1,
			1,
			1,
			1
		],
		_metallicFactor: pbr.metallicFactor ?? 1,
		_roughnessFactor: pbr.roughnessFactor ?? 1,
		_emissiveFactor: mat.emissiveFactor ?? [
			0,
			0,
			0
		],
		_baseColorImage: baseColorImg,
		_metallicRoughnessImage: mrImg,
		_normalImage: normalImg,
		_normalScale: typeof mat.normalTexture?.scale === "number" ? mat.normalTexture.scale : 1,
		_occlusionTexCoord: typeof mat.occlusionTexture?.texCoord === "number" ? mat.occlusionTexture.texCoord : 0,
		_occlusionImage: occlusionImg,
		_emissiveImage: emissiveImg,
		_doubleSided: !!mat.doubleSided,
		_alphaMode: mat.alphaMode ?? "OPAQUE",
		_alphaCutoff: mat.alphaCutoff ?? .5,
		_rawMatDef: rawMat
	};
}
/** Build a per-load image fetcher that decodes glTF texture references via
*  the shared image cache. Used by both core assembleMaterial and the ext
*  driver in load-gltf.ts. */
function makeImageFetcher(json, binChunk, baseUrl, imageCache) {
	return (texInfo) => {
		if (!texInfo) return Promise.resolve(null);
		const imgIdx = getTextureImageIndex(json.textures[texInfo.index]);
		return imageCache[imgIdx] ??= resolveImage(json, binChunk, imgIdx, baseUrl);
	};
}
export { assembleMaterial, makeImageFetcher };

//# sourceMappingURL=gltf-material.js.map