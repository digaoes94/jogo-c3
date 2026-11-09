// src/skeleton/compat-skeleton.ts
/** Clear all authored bone overrides and upload the skeleton's rest pose once. */
function resetSkeletonToRest(skeleton) {
	for (const bone of skeleton.bones) {
		skeleton._overrides.delete(bone._nodeIndex);
		skeleton._worldOverrides.delete(bone._nodeIndex);
	}
	skeleton._bake();
}
export { resetSkeletonToRest };

//# sourceMappingURL=compat-skeleton.js.map