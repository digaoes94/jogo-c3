import { createGpuPicker, disposePicker, pickAsync } from "../../picking/gpu-picker.js";
// src/sprite/picking/pick-billboard.ts
/**
* Pick the topmost billboard sprite under a point, respecting occlusion by meshes and other
* billboards (closest wins). Returns `null` if no billboard is the closest hit there — including
* when a mesh is in front of the billboard, in which case the billboard is considered occluded.
*
* By default a throwaway {@link GpuPicker} is created and disposed per call, so a one-off pick
* (e.g. click-to-select) retains no GPU state. For high-frequency picking (hover, drag) pass a
* caller-owned `picker` from {@link createGpuPicker}: its 1×1 targets, scene UBO, and per-source
* contributors (which compile the pick pipelines) are then reused across calls instead of rebuilt
* each time, and the caller disposes it once via {@link disposePicker} when done. A supplied picker
* must belong to `scene` — the same one passed to `createGpuPicker`.
*
* @param scene - Scene whose billboard systems (and meshes, for occlusion) are tested.
* @param x - Query X in CSS pixels relative to the scene's canvas (same convention as `pickAsync`).
* @param y - Query Y in CSS pixels relative to the scene's canvas.
* @param picker - Optional caller-owned picker to reuse; when omitted, one is created and disposed per call.
* @returns The billboard hit (`{ system, spriteIndex, pickedPoint, distance }`), or `null` for a miss.
*/
async function pickBillboardSprite(scene, x, y, picker) {
	const owned = picker ?? createGpuPicker(scene);
	try {
		return (await pickAsync(owned, x, y))._spritePick ?? null;
	} finally {
		if (picker === void 0) disposePicker(owned);
	}
}
export { pickBillboardSprite };

//# sourceMappingURL=pick-billboard.js.map