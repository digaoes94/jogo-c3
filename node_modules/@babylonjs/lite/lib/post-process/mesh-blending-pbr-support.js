import { _installMeshBlendingGeometrySupport } from "../frame-graph/geometry-mesh-blending.js";
// src/post-process/mesh-blending-pbr-support.ts
/** @internal Install PBR parity support only when a geometry tag attachment is requested. */
function _installMeshBlendingPbrSupport() {
	_installMeshBlendingGeometrySupport();
}
export { _installMeshBlendingPbrSupport };

//# sourceMappingURL=mesh-blending-pbr-support.js.map