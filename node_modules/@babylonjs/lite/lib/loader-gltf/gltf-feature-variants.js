import { acquireTexture } from "../resource/texture-acquire.js";
import { releaseTexture } from "../resource/texture-release.js";
import { collectPbrBoundTextures } from "../material/pbr/collect-pbr-bound-textures.js";
import { _registerAssetContainerSceneCleanup } from "./gltf-scene-cleanup.js";
// src/loader-gltf/gltf-feature-variants.ts
function createVariantTextureSetup(data) {
	const textures = [data.originals, ...Object.values(data.variants)].flat().flatMap(({ material }) => collectPbrBoundTextures(material));
	return (scene, container) => {
		textures.forEach(acquireTexture);
		_registerAssetContainerSceneCleanup(container, scene, () => textures.forEach(releaseTexture));
	};
}
var feature = {
	id: "KHR_materials_variants",
	async applyAsset(meshes, _root, ctx) {
		const variantNames = ctx._json.extensions?.KHR_materials_variants?.variants?.map((v) => v.name);
		if (!variantNames?.length) return {};
		const { loadVariantMaterials } = await import("./gltf-variants.js");
		const materialVariants = await loadVariantMaterials(ctx._json, ctx._binChunk, ctx._baseUrl, variantNames, meshes, ctx._engine, ctx._matExts, ctx._runMatExts, ctx._wrapTex);
		return {
			materialVariants,
			_sceneSetup: createVariantTextureSetup(materialVariants)
		};
	}
};
export { feature as default };

//# sourceMappingURL=gltf-feature-variants.js.map