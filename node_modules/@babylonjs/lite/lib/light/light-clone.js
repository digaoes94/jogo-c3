// src/light/light-clone.ts
/** Copy the common SceneNode and light-filter state into a freshly created light clone. */
function copyLightBase(source, clone) {
	clone.name = source.name + "_clone";
	clone.position.copyFrom(source.position);
	clone.rotationQuaternion.copyFrom(source.rotationQuaternion);
	clone.scaling.copyFrom(source.scaling);
	clone.visible = source.visible;
	clone.metadata = source.metadata;
	clone.excludedMeshIds = source.excludedMeshIds;
	clone.includedOnlyMeshIds = source.includedOnlyMeshIds;
	clone.excludedMeshes = source.excludedMeshes;
	clone.includedOnlyMeshes = source.includedOnlyMeshes;
	if (source._localMatrix) clone._localMatrix = source._localMatrix.slice();
}
export { copyLightBase };

//# sourceMappingURL=light-clone.js.map