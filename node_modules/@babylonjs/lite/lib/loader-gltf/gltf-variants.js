import { getOrCreateSampler } from "../resource/texture-sampler-pool.js";
import { assembleMaterial, makeImageFetcher } from "./gltf-material.js";
import { applyGltfOptInPbrFeatures, identityTexWrap, uploadTex } from "./gltf-pbr-builder.js";
import { applyGltfUvTransform, assemblePbrPropsExt, buildDefaultPbrTexturesExt } from "./gltf-pbr-builder-ext.js";
// src/loader-gltf/gltf-variants.ts
/**
* Self-contained variant material loader.
* Parses variant mappings from glTF JSON primitives, assembles + uploads variant materials,
* and builds MaterialVariantData. Called only when KHR_materials_variants is present.
*/
async function loadVariantMaterials(json, binChunk, baseUrl, variantNames, meshes, engine, exts, runMatExts, wrapTex = identityTexWrap) {
	const generateMipmaps = (await import("../texture/generate-mipmaps.js")).generateMipmaps;
	const sampler = getOrCreateSampler(engine, {
		magFilter: "linear",
		minFilter: "linear",
		mipmapFilter: "linear",
		addressModeU: "repeat",
		addressModeV: "repeat",
		maxAnisotropy: 4
	});
	const matCache = [];
	const imageCache = [];
	const fetchImg = makeImageFetcher(json, binChunk, baseUrl, imageCache);
	const getCachedTex = (bitmap, srgb) => uploadTex(engine, bitmap, srgb, sampler, generateMipmaps);
	const extCtx = {
		_engine: engine,
		async _texture(texInfo, sRGB) {
			if (!texInfo) return;
			const img = await fetchImg(texInfo);
			return img ? wrapTex(uploadTex(engine, img, sRGB, sampler, generateMipmaps), texInfo) : void 0;
		},
		_uploadImage(bitmap, sRGB) {
			return uploadTex(engine, bitmap, sRGB, sampler, generateMipmaps);
		}
	};
	const getMat = (matIdx) => {
		return matCache[matIdx] ??= assembleMaterial(json, binChunk, matIdx, baseUrl, imageCache);
	};
	const pbrCache = /* @__PURE__ */ new Map();
	const getPbr = (gltfMat) => {
		let p = pbrCache.get(gltfMat);
		if (!p) {
			p = (async () => {
				const layers = await runMatExts(gltfMat, exts, extCtx);
				const tex = buildDefaultPbrTexturesExt(engine, gltfMat, sampler, generateMipmaps, getCachedTex, wrapTex, layers);
				const props = assemblePbrPropsExt(gltfMat, tex, layers);
				await applyGltfUvTransform(props, tex);
				await applyGltfOptInPbrFeatures(props, gltfMat);
				return props;
			})();
			pbrCache.set(gltfMat, p);
		}
		return p;
	};
	const originals = [];
	const variants = {};
	for (const name of variantNames) variants[name] = [];
	let meshIdx = 0;
	for (let nodeIdx = 0; nodeIdx < json.nodes.length; nodeIdx++) {
		const node = json.nodes[nodeIdx];
		if (node.mesh === void 0) continue;
		const gltfMesh = json.meshes[node.mesh];
		for (const primitive of gltfMesh.primitives) {
			const mesh = meshes[meshIdx];
			const variantExt = primitive.extensions?.KHR_materials_variants;
			if (variantExt?.mappings) {
				originals.push({
					mesh,
					material: mesh.material
				});
				for (const mapping of variantExt.mappings) {
					const pbrMat = await getPbr(await getMat(mapping.material));
					for (const vi of mapping.variants) {
						const name = variantNames[vi];
						if (name) variants[name].push({
							mesh,
							material: pbrMat
						});
					}
				}
			}
			meshIdx++;
		}
	}
	return {
		names: variantNames,
		variants,
		originals
	};
}
export { loadVariantMaterials };

//# sourceMappingURL=gltf-variants.js.map