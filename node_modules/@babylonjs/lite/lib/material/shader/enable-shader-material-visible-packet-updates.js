// src/material/shader/enable-shader-material-visible-packet-updates.ts
/** Defer hidden packets' system-uniform and resource updates for one ShaderMaterial.
* Shared custom uniforms, transparent sorting and initial allocation remain unchanged.
* Use `setMeshVisible` to invalidate cached bundles when hiding or restoring meshes.
* Pending packet changes are refreshed by the normal per-pass update before the restored draw.
* Material views created from `material` inherit this policy.
* @param material - Material whose packets should update only while visible.
*/
function enableShaderMaterialVisiblePacketUpdates(material) {
	material._deferPacketUpdate = isHidden;
}
function isHidden(mesh) {
	return mesh.visible === false;
}
export { enableShaderMaterialVisiblePacketUpdates };

//# sourceMappingURL=enable-shader-material-visible-packet-updates.js.map