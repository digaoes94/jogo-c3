// src/mesh/enable-mirrored-meshes.ts
/**
* Enable triangle-winding reversal for mirrored meshes.
*
* `await` it once, after your assets are added and before `registerScene`. Applies to both PBR and
* Standard materials, and keeps working when a mesh's mirroring changes at runtime: each frame the
* watcher only looks at meshes whose world matrix actually changed (an integer version compare),
* computes a determinant for those alone, and rebuilds a pipeline only when the sign really flipped.
*
* **Only the runtime watcher is scoped to `scene`.** The pipeline-side winding resolution is
* installed process-wide the first time this is called, so in a multi-scene application every scene
* starts resolving winding from its meshes' world determinants — including scenes that never passed
* themselves here. That makes those scenes render mirrored meshes correctly rather than inside-out,
* but they will not pick up a mirroring that changes *after* their renderables are built; call this
* for each scene that needs runtime tracking.
*
* The watcher is appended to the scene's per-frame callbacks so it sees the transforms produced by
* animations and user code in the same frame. Call it again after adding an asset that registers its
* own per-frame hooks (e.g. an animated glTF loaded later) to re-anchor it — repeat calls replace
* that scene's previous watcher rather than stacking another one.
* @param scene - Scene whose meshes should be watched for mirroring at runtime.
*/
async function enableMirroredMeshes(scene) {
	(await import("../material/standard/std-mirrored-support.js")).installMirroredMeshSupport(scene);
}
export { enableMirroredMeshes };

//# sourceMappingURL=enable-mirrored-meshes.js.map