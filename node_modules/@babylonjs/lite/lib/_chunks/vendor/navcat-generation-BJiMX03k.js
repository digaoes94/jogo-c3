import { B as create$2, C as erodeWalkableArea, E as filterWalkableLowHeightSpans, F as polyMeshDetailToTileDetailMesh, H as create, I as polyMeshToTilePolys, L as rasterizeTriangles, N as markWalkableTriangles, T as filterLowHangingWalkableObstacles, U as create$1, V as min, a as addTile, c as buildDistanceField, d as buildRegions, f as buildTile, g as createFindNearestPolyResult, l as buildPolyMesh, m as calculateMeshBounds, n as ContourBuildFlags, o as buildCompactHeightfield, p as calculateGridSize, s as buildContours, t as BuildContext, u as buildPolyMeshDetail, v as createHeightfield, w as filterLedgeSpans, y as createNavMesh } from "./navcat-BGuLG0iQ.js";
create();
create();
create();
create();
create();
create();
create();
create();
create();
create();
create();
create();
create();
create();
create();
create();
var AgentState;
(function(AgentState) {
	AgentState[AgentState["INVALID"] = 0] = "INVALID";
	AgentState[AgentState["WALKING"] = 1] = "WALKING";
	AgentState[AgentState["OFFMESH"] = 2] = "OFFMESH";
})(AgentState || (AgentState = {}));
var AgentTargetState;
(function(AgentTargetState) {
	AgentTargetState[AgentTargetState["NONE"] = 0] = "NONE";
	AgentTargetState[AgentTargetState["FAILED"] = 1] = "FAILED";
	AgentTargetState[AgentTargetState["VALID"] = 2] = "VALID";
	AgentTargetState[AgentTargetState["REQUESTING"] = 3] = "REQUESTING";
	AgentTargetState[AgentTargetState["WAITING_FOR_QUEUE"] = 4] = "WAITING_FOR_QUEUE";
	AgentTargetState[AgentTargetState["WAITING_FOR_PATH"] = 5] = "WAITING_FOR_PATH";
	AgentTargetState[AgentTargetState["VELOCITY"] = 6] = "VELOCITY";
})(AgentTargetState || (AgentTargetState = {}));
var CrowdUpdateFlags;
(function(CrowdUpdateFlags) {
	CrowdUpdateFlags[CrowdUpdateFlags["ANTICIPATE_TURNS"] = 1] = "ANTICIPATE_TURNS";
	CrowdUpdateFlags[CrowdUpdateFlags["OBSTACLE_AVOIDANCE"] = 2] = "OBSTACLE_AVOIDANCE";
	CrowdUpdateFlags[CrowdUpdateFlags["SEPARATION"] = 4] = "SEPARATION";
	CrowdUpdateFlags[CrowdUpdateFlags["OPTIMIZE_VIS"] = 8] = "OPTIMIZE_VIS";
	CrowdUpdateFlags[CrowdUpdateFlags["OPTIMIZE_TOPO"] = 16] = "OPTIMIZE_TOPO";
})(CrowdUpdateFlags || (CrowdUpdateFlags = {}));
createFindNearestPolyResult();
create();
create();
create();
create();
create$1();
create$1();
create();
create();
create();
create();
function generateSoloNavMesh(input, options) {
	const ctx = BuildContext.create();
	BuildContext.start(ctx, "navmesh generation");
	const { positions, indices } = input;
	const { cellSize, cellHeight, walkableRadiusVoxels, walkableRadiusWorld, walkableClimbVoxels, walkableClimbWorld, walkableHeightVoxels, walkableHeightWorld, walkableSlopeAngleDegrees, borderSize, minRegionArea, mergeRegionArea, maxSimplificationError, maxEdgeLength, maxVerticesPerPoly, detailSampleDistance, detailSampleMaxError } = options;
	BuildContext.start(ctx, "mark walkable triangles");
	const triAreaIds = new Uint8Array(indices.length / 3).fill(0);
	markWalkableTriangles(positions, indices, triAreaIds, walkableSlopeAngleDegrees);
	BuildContext.end(ctx, "mark walkable triangles");
	BuildContext.start(ctx, "rasterize triangles");
	const bounds = calculateMeshBounds(create$2(), positions, indices);
	const [heightfieldWidth, heightfieldHeight] = calculateGridSize(create$1(), bounds, cellSize);
	const heightfield = createHeightfield(heightfieldWidth, heightfieldHeight, bounds, cellSize, cellHeight);
	rasterizeTriangles(ctx, heightfield, positions, indices, triAreaIds, walkableClimbVoxels);
	BuildContext.end(ctx, "rasterize triangles");
	BuildContext.start(ctx, "filter walkable surfaces");
	filterLowHangingWalkableObstacles(heightfield, walkableClimbVoxels);
	filterLedgeSpans(heightfield, walkableHeightVoxels, walkableClimbVoxels);
	filterWalkableLowHeightSpans(heightfield, walkableHeightVoxels);
	BuildContext.end(ctx, "filter walkable surfaces");
	BuildContext.start(ctx, "build compact heightfield");
	const compactHeightfield = buildCompactHeightfield(ctx, walkableHeightVoxels, walkableClimbVoxels, heightfield);
	BuildContext.end(ctx, "build compact heightfield");
	BuildContext.start(ctx, "erode walkable area");
	erodeWalkableArea(walkableRadiusVoxels, compactHeightfield);
	BuildContext.end(ctx, "erode walkable area");
	BuildContext.start(ctx, "build compact heightfield distance field");
	buildDistanceField(compactHeightfield);
	BuildContext.end(ctx, "build compact heightfield distance field");
	BuildContext.start(ctx, "build compact heightfield regions");
	buildRegions(ctx, compactHeightfield, borderSize, minRegionArea, mergeRegionArea);
	BuildContext.end(ctx, "build compact heightfield regions");
	BuildContext.start(ctx, "trace and simplify region contours");
	const contourSet = buildContours(ctx, compactHeightfield, maxSimplificationError, maxEdgeLength, ContourBuildFlags.CONTOUR_TESS_WALL_EDGES);
	BuildContext.end(ctx, "trace and simplify region contours");
	BuildContext.start(ctx, "build polygons mesh from contours");
	const polyMesh = buildPolyMesh(ctx, contourSet, maxVerticesPerPoly);
	for (let polyIndex = 0; polyIndex < polyMesh.nPolys; polyIndex++) {
		if (polyMesh.areas[polyIndex] === 1) polyMesh.areas[polyIndex] = 0;
		if (polyMesh.areas[polyIndex] === 0) polyMesh.flags[polyIndex] = 1;
	}
	BuildContext.end(ctx, "build polygons mesh from contours");
	BuildContext.start(ctx, "build detail mesh from contours");
	const polyMeshDetail = buildPolyMeshDetail(ctx, polyMesh, compactHeightfield, detailSampleDistance, detailSampleMaxError);
	BuildContext.end(ctx, "build detail mesh from contours");
	BuildContext.end(ctx, "navmesh generation");
	const intermediates = {
		buildContext: ctx,
		input: {
			positions,
			indices
		},
		triAreaIds,
		heightfield,
		compactHeightfield,
		contourSet,
		polyMesh,
		polyMeshDetail
	};
	const nav = createNavMesh();
	nav.tileWidth = polyMesh.bounds[3] - polyMesh.bounds[0];
	nav.tileHeight = polyMesh.bounds[5] - polyMesh.bounds[2];
	min(nav.origin, polyMesh.bounds);
	const tilePolys = polyMeshToTilePolys(polyMesh);
	const tileDetailMesh = polyMeshDetailToTileDetailMesh(tilePolys.polys, polyMeshDetail);
	const tileParams = {
		bounds: polyMesh.bounds,
		vertices: tilePolys.vertices,
		polys: tilePolys.polys,
		detailMeshes: tileDetailMesh.detailMeshes,
		detailVertices: tileDetailMesh.detailVertices,
		detailTriangles: tileDetailMesh.detailTriangles,
		tileX: 0,
		tileY: 0,
		tileLayer: 0,
		cellSize,
		cellHeight,
		walkableHeight: walkableHeightWorld,
		walkableRadius: walkableRadiusWorld,
		walkableClimb: walkableClimbWorld
	};
	const tile = buildTile(tileParams);
	addTile(nav, tile);
	return {
		navMesh: nav,
		intermediates
	};
}
export { generateSoloNavMesh as t };

//# sourceMappingURL=navcat-generation-BJiMX03k.js.map