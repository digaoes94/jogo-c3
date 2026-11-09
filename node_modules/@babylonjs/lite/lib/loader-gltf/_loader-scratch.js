import { allocateMat4 } from "../math/_matrix-allocator.js";
// src/loader-gltf/_loader-scratch.ts
var _tmpLocal = null;
var _tmpAnim = null;
var _tmpInstance = null;
/** Scratch for non-recursive local TRS composition in `computeNodeWorldMatrix`.
*  Safe to reuse across non-recursive sibling calls; recursive `world`
*  matrices are still allocated per-call inside the parser. */
function getLoaderTmpLocal() {
	return _tmpLocal ??= allocateMat4();
}
/** Scratch for per-bone matrix multiplication inside `computeBoneTextureData`. */
function getLoaderTmpAnim() {
	return _tmpAnim ??= allocateMat4();
}
/** Scratch for per-instance world composition inside the GPU-instancing feature. */
function getLoaderTmpInstance() {
	return _tmpInstance ??= allocateMat4();
}
export { getLoaderTmpAnim, getLoaderTmpInstance, getLoaderTmpLocal };

//# sourceMappingURL=_loader-scratch.js.map