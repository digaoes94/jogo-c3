// src/material/pbr/pbr-mesh-lod-debug.ts
var CONE_F32 = /* @__PURE__ */ new Float32Array(1);
var CONE_U32 = new Uint32Array(CONE_F32.buffer);
/** Shader `debugMode` code (0 = off). Mirrored by the WGSL fragment branch. */
function meshLoDDebugModeCode(view) {
	switch (view) {
		case "meshlet-id": return 1;
		case "lod-depth": return 2;
		case "selected-group": return 3;
		case "page-residency": return 4;
		case "requested-pages": return 5;
		case "meshlet-cone": return 6;
		default: return 0;
	}
}
/** Page-residency colour code: 0 gray (unavailable), 1 green (resident),
*  2 yellow (pinned coarse), 3 red (terminal failure). */
function meshLoDPageResidencyCode(pinned, state) {
	if (state === "terminal-failed") return 3;
	if (pinned) return 2;
	if (state === "gpu-resident") return 1;
	return 0;
}
/** Requested-pages colour code: 1 cyan (streamed-in, on-demand resident),
*  2 orange (queued/in-flight/transitioning), 0 normal material otherwise. */
function meshLoDPageRequestCode(pinned, state) {
	switch (state) {
		case "queued":
		case "fetching":
		case "retry-wait":
		case "received":
		case "decoding":
		case "cpu-resident":
		case "uploading":
		case "evicting": return 2;
		case "gpu-resident": return pinned ? 0 : 1;
		default: return 0;
	}
}
/** Bitcast a cone-culling margin into the draw vertex's reserved u32 word. */
function meshLoDConeDebugAttr(margin) {
	CONE_F32[0] = margin;
	return CONE_U32[0];
}
/** Per-cluster attribute stored in the reserved draw-vertex word for the active
*  mode. The vertex `clusterId` (a separate word) already covers meshlet-id, so
*  that mode stores nothing here. */
function meshLoDClusterDebugAttr(mode, groupId, depth, residencyCode, requestCode) {
	switch (mode) {
		case 2: return depth;
		case 3: return groupId;
		case 4: return residencyCode;
		case 5: return requestCode;
		default: return 0;
	}
}
export { meshLoDClusterDebugAttr, meshLoDConeDebugAttr, meshLoDDebugModeCode, meshLoDPageRequestCode, meshLoDPageResidencyCode };

//# sourceMappingURL=pbr-mesh-lod-debug.js.map