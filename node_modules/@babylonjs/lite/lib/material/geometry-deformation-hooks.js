// src/material/geometry-deformation-hooks.ts
var _feature = null;
/** @internal Optional previous-depth output expression installed by the producer enabler. */
var geometryVelocityOutput = null;
/** @internal An explicit velocity feature supplies the same implementation as legacy Standard preloading. */
function installGeometryDeformationVelocity(feature, output) {
	_feature = feature;
	geometryVelocityOutput = output;
}
/** @internal Load previous-pose behavior only for a matching geometry velocity pass. */
async function preloadGeometryDeformationVelocity(meshes, velocity) {
	if (velocity && !_feature && meshes.some((mesh) => !mesh.thinInstances && !mesh.vat && (!!mesh.skeleton || !!mesh.morphTargets))) _feature = await import("./geometry-deformation-velocity.js");
}
/** @internal Resolve the preloaded optional feature without creating global state. */
function getGeometryDeformationVelocity() {
	return _feature;
}
export { geometryVelocityOutput, getGeometryDeformationVelocity, installGeometryDeformationVelocity, preloadGeometryDeformationVelocity };

//# sourceMappingURL=geometry-deformation-hooks.js.map