// src/mesh/GaussianSplatting/gs-gpu-picking-fragment.ts
/** Lite port of `GaussianSplattingGpuPickingMaterialPlugin`'s non-compound path:
*  declare a `picking` UBO at `@group(2) @binding(0)` (allocated by the picking
*  pipeline) and override the fragment colour with the per-mesh pick id. */
var gsGpuPickingFragment = {
	id: "gsGpuPicking",
	helperFunctions: `struct GsPickingU{pickingColor:vec3<f32>};@group(2)@binding(0)var<uniform>picking:GsPickingU;`,
	fragmentSlots: { GS_FRAGMENT_BEFORE_FRAGCOLOR: `if(finalColor.a<0.001){discard;}finalColor=vec4<f32>(picking.pickingColor,1.0);` }
};
/** CPU helper matching BJS `GaussianSplattingGpuPickingMaterialPlugin.EncodeIdToColor`. */
function encodeIdToColor(id) {
	return [
		(id >> 16 & 255) / 255,
		(id >> 8 & 255) / 255,
		(id & 255) / 255
	];
}
export { encodeIdToColor, gsGpuPickingFragment };

//# sourceMappingURL=gs-gpu-picking-fragment.js.map