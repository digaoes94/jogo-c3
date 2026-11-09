import { _invalidateSceneUboCaches, registerEnvSceneUniforms } from "./scene-ubo-extras.js";
import { _registerEnvironmentSkyboxShaderPatch } from "../material/pbr/environment-skybox-shader-composer.js";
// src/scene/set-environment-rotation.ts
var loadRotationSkyboxPatch = () => import("../material/pbr/fragments/environment-rotation-fragment.js");
/**
* Set environment rotation around the Y axis, in radians.
* Call once before the visible environment skybox is built; later calls update it dynamically.
*/
function setEnvironmentRotation(scene, rotation) {
	registerEnvSceneUniforms(scene);
	scene._environmentRotation = rotation;
	_registerEnvironmentSkyboxShaderPatch(scene, 0, loadRotationSkyboxPatch);
	_invalidateSceneUboCaches(scene);
}
/**
* Rotate only the image-based lighting around the Y axis, in radians. Unlike {@link setEnvironmentRotation}, this never
* registers the visible-skybox patch, so a skybox keeps its own orientation (none, or the one given by
* {@link setEnvironmentSkyboxRotation}). Later calls update the lighting dynamically.
*/
function setEnvironmentLightingRotation(scene, rotation) {
	registerEnvSceneUniforms(scene);
	scene._environmentRotation = rotation;
	_invalidateSceneUboCaches(scene);
}
/**
* Give the visible environment skybox a fixed rotation around the Y axis, in radians, independent of the lighting
* rotation. The angle is compiled into the skybox shader, so call it before the skybox is built. It shares the skybox
* patch slot with {@link setEnvironmentRotation}: whichever of the two is called last before the build decides it.
*/
function setEnvironmentSkyboxRotation(scene, rotation) {
	_registerEnvironmentSkyboxShaderPatch(scene, 0, async () => {
		const { _rotateSkyboxDirection } = await import("../material/pbr/fragments/environment-rotation-fragment.js");
		return { _apply: (fragment) => _rotateSkyboxDirection(fragment, `f32(${rotation})`) };
	});
}
export { setEnvironmentLightingRotation, setEnvironmentRotation, setEnvironmentSkyboxRotation };

//# sourceMappingURL=set-environment-rotation.js.map