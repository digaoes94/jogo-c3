import { navcatMesh } from "./navcat-state.js";
// src/navigation/navcat-queries.ts
/** Find a passing polygon within axis-aligned half extents in Lite coordinates. */
function findNavcatNearestPoly(manager, point, halfExtents) {
	navcatMesh(manager);
	return manager._api.nearest(manager, point, halfExtents);
}
/** Find a complete or partial straight path. Search debugging is opt-in through keepSearch. */
function findNavcatPath(manager, start, end, halfExtents, options) {
	navcatMesh(manager);
	return manager._api.path(manager, start, end, halfExtents, options);
}
/** Cast across the polygon surface. Destination Y does not affect traversal. */
function raycastNavcat(manager, start, end) {
	navcatMesh(manager);
	return manager._api.ray(manager, start, end);
}
/** Constrain movement to the surface and return a new location. */
function moveAlongNavcatSurface(manager, start, end) {
	navcatMesh(manager);
	return manager._api.move(manager, start, end);
}
export { findNavcatNearestPoly, findNavcatPath, moveAlongNavcatSurface, raycastNavcat };

//# sourceMappingURL=navcat-queries.js.map