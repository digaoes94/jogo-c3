// src/loader-gltf/material-variants.ts
/**
* Get available variant names from a loaded glTF asset.
* Returns an empty array if the asset has no material variants.
*/
function getVariantNames(container) {
	return container.materialVariants?.names ?? [];
}
/**
* Select a material variant by name on a loaded glTF asset.
*
* Two-step operation:
* 1. Restores ALL variant-participating meshes to their original (default) materials.
* 2. Applies the selected variant's material overrides.
*
* This ensures meshes without a mapping for the new variant revert to their defaults,
* even when switching between variants (e.g. Red → White).
*
* Works both before and after addToScene():
* - Before: materials are set directly (renderable built later).
* - After: the property-setter intercept triggers renderable rebuild automatically.
*/
function selectVariant(container, variantName) {
	const data = container.materialVariants;
	if (!data) return;
	for (const entry of data.originals) entry.mesh.material = entry.material;
	const entries = data.variants[variantName];
	if (entries) for (const entry of entries) entry.mesh.material = entry.material;
}
/**
* Reset all variant-participating meshes to their original (default) materials.
*/
function resetVariant(container) {
	const data = container.materialVariants;
	if (!data) return;
	for (const entry of data.originals) entry.mesh.material = entry.material;
}
export { getVariantNames, resetVariant, selectVariant };

//# sourceMappingURL=material-variants.js.map