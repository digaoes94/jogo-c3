// src/material/pbr/pbr-geometry-velocity-hooks.ts
/** @internal Explicitly installed velocity behavior; absent from ordinary geometry passes. */
var pbrGeometryVelocity = null;
/** @internal Keep installation outside the geometry-view namespace imported by ordinary tasks. */
function installPbrGeometryVelocity(velocity) {
	pbrGeometryVelocity = velocity;
}
export { installPbrGeometryVelocity, pbrGeometryVelocity };

//# sourceMappingURL=pbr-geometry-velocity-hooks.js.map