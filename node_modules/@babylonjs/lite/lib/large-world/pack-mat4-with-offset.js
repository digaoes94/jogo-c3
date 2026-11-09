// src/large-world/pack-mat4-with-offset.ts
/** @internal Mesh-world packer with floating-origin offset subtraction.
*  Same 16-element layout as `packMat4IntoF32` but subtracts the offset
*  from the translation column `[12..14]` in JS-number (F64) precision
*  BEFORE the implicit F32 store at the typed-array assignment. For an
*  F64-backed mat the `large - large = small` step is computed at full
*  F64 precision; a single F32 store rounds the small remainder with
*  ample headroom. That's the whole precision-recovery trick.
*
*  Takes `offsetX/Y/Z` as three scalars rather than a `[number, number, number]`
*  tuple to avoid any per-pack array allocation. */
function packMat4IntoF32WithOffset(view, mat, offsetFloats, srcOffsetFloats, offsetX, offsetY, offsetZ) {
	const src = mat;
	const s = srcOffsetFloats;
	const o = offsetFloats;
	view[o + 0] = src[s + 0];
	view[o + 1] = src[s + 1];
	view[o + 2] = src[s + 2];
	view[o + 3] = src[s + 3];
	view[o + 4] = src[s + 4];
	view[o + 5] = src[s + 5];
	view[o + 6] = src[s + 6];
	view[o + 7] = src[s + 7];
	view[o + 8] = src[s + 8];
	view[o + 9] = src[s + 9];
	view[o + 10] = src[s + 10];
	view[o + 11] = src[s + 11];
	view[o + 12] = src[s + 12] - offsetX;
	view[o + 13] = src[s + 13] - offsetY;
	view[o + 14] = src[s + 14] - offsetZ;
	view[o + 15] = src[s + 15];
}
/** @internal Factory: bind a scene's camera into a closure that packs
*  mesh-world matrices with the live offset (camera world position)
*  subtracted. Engine sets `engine._makePackMeshWorld = makePackMeshWorld`
*  only when `useFloatingOrigin: true`. Renderables call the factory once
*  at construction to resolve their packer; the per-frame hot path then
*  derives offset from `scene.camera.worldMatrix` at each pack — zero
*  allocation, no mirror-state to keep in sync. */
function makePackMeshWorld(scene) {
	return (view, mat, offsetFloats, srcOffsetFloats) => {
		const cam = scene.camera;
		if (!cam) {
			packMat4IntoF32WithOffset(view, mat, offsetFloats, srcOffsetFloats, 0, 0, 0);
			return;
		}
		const w = cam.worldMatrix;
		packMat4IntoF32WithOffset(view, mat, offsetFloats, srcOffsetFloats, w[12], w[13], w[14]);
	};
}
export { makePackMeshWorld, packMat4IntoF32WithOffset };

//# sourceMappingURL=pack-mat4-with-offset.js.map