// src/material/resolve-mesh-rebuild.ts
/** @internal Resolve only this scene's completed build or an explicitly scene-independent factory. */
function resolveMeshRebuild(scene, builder) {
	const group = scene._groups.get(builder);
	return group ? group.r : builder._sceneIndependentRebuild ? builder._rebuildSingle : void 0;
}
export { resolveMeshRebuild };

//# sourceMappingURL=resolve-mesh-rebuild.js.map