import { checkNavcatVersion, toNavcat } from "./navcat-state.js";
import { i as addOffMeshConnection, j as isOffMeshConnectionConnected, z as removeOffMeshConnection } from "../_chunks/vendor/navcat-BGuLG0iQ.js";
// src/navigation/navcat-connections-runtime.ts
function valid(manager, mesh, connection) {
	return connection._owner === manager && connection._meshVersion === manager._meshVersion && !connection._removed && mesh.offMeshConnections[connection.id]?.sequence === connection._sequence;
}
function add(manager, version, options) {
	const mesh = checkNavcatVersion(manager, version);
	const id = addOffMeshConnection(mesh, {
		start: toNavcat(options.start),
		end: toNavcat(options.end),
		radius: options.radius,
		direction: options.bidirectional ? 1 : 0,
		flags: options.flags,
		area: options.area
	});
	manager._revision++;
	return {
		id,
		_owner: manager,
		_meshVersion: version,
		_sequence: mesh.offMeshConnections[id].sequence,
		_removed: false
	};
}
function remove(manager, version, connection) {
	const mesh = checkNavcatVersion(manager, version);
	if (!valid(manager, mesh, connection)) return false;
	removeOffMeshConnection(mesh, connection.id);
	connection._removed = true;
	manager._revision++;
	return true;
}
function connected(manager, version, connection) {
	const mesh = checkNavcatVersion(manager, version);
	return valid(manager, mesh, connection) && isOffMeshConnectionConnected(mesh, connection.id);
}
export { add, connected, remove };

//# sourceMappingURL=navcat-connections-runtime.js.map