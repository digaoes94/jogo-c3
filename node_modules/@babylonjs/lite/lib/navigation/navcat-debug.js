import { navcatVersion } from "./navcat-state.js";
// src/navigation/navcat-debug.ts
/** Create owned CPU debug arrays; caller owns rendering and GPU cleanup. */
async function createNavcatDebugGeometry(manager, options = {}) {
	const version = navcatVersion(manager);
	const copy = {
		navMesh: options.navMesh ?? true,
		connections: options.connections ?? true,
		search: options.search
	};
	return (await import("./navcat-debug-runtime.js")).debug(manager, version, copy);
}
export { createNavcatDebugGeometry };

//# sourceMappingURL=navcat-debug.js.map