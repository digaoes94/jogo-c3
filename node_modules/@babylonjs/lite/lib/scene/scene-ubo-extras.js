// src/scene/scene-ubo-extras.ts
/** Write the fog slice of the SceneUniforms struct (float offsets 80–86). */
function writeFogUbo(data, scene) {
	const fog = scene.fog;
	if (fog) {
		data[80] = fog.mode;
		data[81] = fog.start;
		data[82] = fog.end;
		data[83] = fog.density;
		data[84] = fog.color[0];
		data[85] = fog.color[1];
		data[86] = fog.color[2];
	}
}
/** Write the clip-plane slice of the SceneUniforms struct (float offsets 88–91). */
function writeClipPlaneUbo(data, scene) {
	const clipPlane = scene.clipPlane;
	if (clipPlane) {
		data[88] = clipPlane[0];
		data[89] = clipPlane[1];
		data[90] = clipPlane[2];
		data[91] = clipPlane[3];
	}
}
/** Write the opt-in environment slice of the SceneUniforms struct: rotation
*  (offset 36) and spherical harmonics (offsets 40–75). */
function writeEnvUbo(data, scene) {
	data[36] = scene._environmentRotation ?? 0;
	const sh = scene._envTextures?.sphericalHarmonics;
	if (sh) data.set(sh, 40);
}
/** @internal Register a contributor on the scene, deduping by function reference. */
function _registerSceneUboContributor(scene, contributor) {
	const list = scene._sceneUboContributors ??= [];
	if (!list.includes(contributor)) list.push(contributor);
}
/** @internal Force every forward render task to rewrite its scene UBO. */
function _invalidateSceneUboCaches(scene) {
	for (const task of scene._frameGraph._tasks) if (task._sceneUboCacheKey) task._sceneUboCacheKey.length = 0;
}
/**
* Enable scene fog and register its scene-uniform contributor.
*
* Fog is an opt-in feature: importing `setFog` is what pulls the fog UBO writer
* into the bundle, keeping those bytes out of scenes that never use fog.
*
* @param scene - The scene to configure.
* @param config - The fog configuration (mode, density, start, end, color).
*/
function setFog(scene, config) {
	scene.fog = config;
	_registerSceneUboContributor(scene, writeFogUbo);
}
/**
* Set the scene clip plane and register its scene-uniform contributor.
*
* The clip plane is opt-in: importing `setClipPlane` is what pulls the clip-plane
* UBO writer into the bundle, keeping those bytes out of scenes that never clip.
*
* @param scene - The scene to configure.
* @param plane - The clip plane as `[a, b, c, d]` coefficients of `a·x + b·y + c·z + d`.
*/
function setClipPlane(scene, plane) {
	scene.clipPlane = plane;
	_registerSceneUboContributor(scene, writeClipPlaneUbo);
}
/**
* Register the environment rotation and spherical-harmonics scene-uniform contributor.
* Called by the environment loaders right after assigning `scene._envTextures`.
* @internal
*/
function registerEnvSceneUniforms(scene) {
	_registerSceneUboContributor(scene, writeEnvUbo);
}
export { _invalidateSceneUboCaches, _registerSceneUboContributor, registerEnvSceneUniforms, setClipPlane, setFog };

//# sourceMappingURL=scene-ubo-extras.js.map