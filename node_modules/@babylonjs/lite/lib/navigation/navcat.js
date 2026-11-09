import { assertNavcatIdle, copyNavcatFilter, copyNavcatVector, navcatMesh } from "./navcat-state.js";
import { parseNavcatMesh, stringifyNavcatMesh } from "./navcat-json.js";
// src/navigation/navcat.ts
/** Load an exclusively owned versioned Navcat 0.4.1 asset. Loads query code only; no Wasm or generator. */
async function createNavcatManager(json, options = {}) {
	assertNavcatIdle();
	const filter = copyNavcatFilter(options.filter);
	const halfExtents = copyNavcatVector(options.halfExtents ?? {
		x: 1,
		y: 2,
		z: 1
	}, "half extents", true);
	const mesh = parseNavcatMesh(json);
	const api = await import("./navcat-runtime.js");
	return {
		backend: "navcat",
		_mesh: mesh,
		_api: api,
		_filter: filter,
		_queryFilter: api.createQueryFilter(filter),
		_halfExtents: halfExtents,
		_halfExtentsTuple: [
			halfExtents.x,
			halfExtents.y,
			halfExtents.z
		],
		_revision: 0,
		_meshVersion: 0,
		_disposed: false
	};
}
/** Atomically replace the owned mesh; invalid JSON leaves the previous graph intact. */
function replaceNavcatMesh(manager, json) {
	assertNavcatIdle();
	navcatMesh(manager);
	manager._mesh = parseNavcatMesh(json);
	manager._revision++;
	manager._meshVersion++;
}
/** Export a fresh versioned asset string, including current connections. */
function exportNavcatMesh(manager) {
	assertNavcatIdle();
	return stringifyNavcatMesh(navcatMesh(manager));
}
/** Copy filter options, preserving callback identity. Null restores the default filter. */
function setNavcatFilter(manager, filter) {
	assertNavcatIdle();
	navcatMesh(manager);
	const copy = copyNavcatFilter(filter);
	manager._queryFilter = manager._api.createQueryFilter(copy);
	manager._filter = copy;
}
/** Idempotently release owned mesh data and callback references. Later queries throw. */
function disposeNavcatManager(manager) {
	if (manager._disposed) return;
	assertNavcatIdle();
	manager._disposed = true;
	manager._revision++;
	manager._meshVersion++;
	manager._mesh = null;
	manager._api = null;
	manager._filter = null;
	manager._queryFilter = null;
	manager._halfExtents = null;
	manager._halfExtentsTuple = null;
}
export { createNavcatManager, disposeNavcatManager, exportNavcatMesh, replaceNavcatMesh, setNavcatFilter };

//# sourceMappingURL=navcat.js.map