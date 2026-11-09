import { stringifyNavcatMesh } from "./navcat-json.js";
import { t as generateSoloNavMesh } from "../_chunks/vendor/navcat-generation-BJiMX03k.js";
// src/navigation/navcat-generation-runtime.ts
function generate(geometry, o) {
	const result = generateSoloNavMesh(geometry, {
		cellSize: o.cellSize,
		cellHeight: o.cellHeight,
		walkableRadiusVoxels: Math.ceil(o.agentRadius / o.cellSize),
		walkableRadiusWorld: o.agentRadius,
		walkableClimbVoxels: Math.floor(o.maxClimb / o.cellHeight),
		walkableClimbWorld: o.maxClimb,
		walkableHeightVoxels: Math.ceil(o.agentHeight / o.cellHeight),
		walkableHeightWorld: o.agentHeight,
		walkableSlopeAngleDegrees: o.maxSlope,
		borderSize: 0,
		minRegionArea: o.minRegionArea,
		mergeRegionArea: o.mergeRegionArea,
		maxSimplificationError: o.maxSimplificationError,
		maxEdgeLength: o.maxEdgeLength,
		maxVerticesPerPoly: o.maxVerticesPerPoly,
		detailSampleDistance: o.detailSampleDistance,
		detailSampleMaxError: o.detailSampleMaxError
	});
	return stringifyNavcatMesh(result.navMesh);
}
export { generate };

//# sourceMappingURL=navcat-generation-runtime.js.map