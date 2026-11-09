// src/material/shader/shader-system-dependencies.ts
var WORLD = 1;
var VIEW = 2;
var PROJECTION = 4;
var VIEW_PROJECTION = 8;
var CAMERA_POSITION = 16;
var SCREEN_SIZE = 32;
var ALPHA_CUTOFF = 64;
/** Every dependency on the active camera's transform or projection. */
var CAMERA = 30;
var DEPENDENCIES = {
	__proto__: null,
	world: 1,
	view: 2,
	projection: 4,
	viewProjection: 8,
	worldView: 3,
	worldViewProjection: 9,
	cameraPosition: 16,
	screenSize: 32,
	alphaCutoff: 64
};
/** @internal Dependency bits of one system uniform name; 0 for any non-system name. */
function shaderSystemDependency(name) {
	return DEPENDENCIES[name] ?? 0;
}
/** @internal Dependencies of the declared system layout, including composed matrices. */
function shaderSystemDependencies(spec) {
	let dependencies = 0;
	for (const name of spec._offsets.keys()) dependencies |= shaderSystemDependency(name);
	return dependencies;
}
export { ALPHA_CUTOFF, CAMERA, CAMERA_POSITION, PROJECTION, SCREEN_SIZE, VIEW, VIEW_PROJECTION, WORLD, shaderSystemDependencies, shaderSystemDependency };

//# sourceMappingURL=shader-system-dependencies.js.map