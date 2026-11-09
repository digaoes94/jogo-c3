import { _preloadStdMeshExt } from "./standard-group-builder.js";
import { _installStandardUvOffsetResolver } from "./standard-pipeline.js";
// src/material/standard/enable-standard-mesh-features.ts
/**
* Published opt-ins for Standard skeletal skinning and UV translation. Import
* from the `@babylonjs/lite` root entry.
*
* RGBA vertex colours are enabled separately through the canonical
* `enableStandardVertexColors()` from
* the `@babylonjs/lite` root entry.
*/
var _skeletonEnabled = false;
/** Enable four/eight-influence skeletal skinning for Standard meshes. */
function enableStandardSkeleton() {
	if (_skeletonEnabled) return;
	_skeletonEnabled = true;
	_preloadStdMeshExt(() => import("./fragments/std-skeleton-fragment.js"), "stdSkeletonExt");
}
var _uvOffsetEnabled = false;
/** Enable `StandardMaterialProps.uvOffset` reads. Missing offsets remain [0, 0]. */
function enableStandardUvOffset() {
	if (_uvOffsetEnabled) return;
	_uvOffsetEnabled = true;
	_installStandardUvOffsetResolver((material) => material.uvOffset ?? null);
}
export { enableStandardSkeleton, enableStandardUvOffset };

//# sourceMappingURL=enable-standard-mesh-features.js.map