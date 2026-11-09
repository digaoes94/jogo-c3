import { t as SCENE_UBO_WGSL } from "../../_chunks/scene-uniforms-BGiGt-2G.js";
// src/material/pbr/environment-skybox-shader-composer.ts
/** @internal Register one feature-owned skybox shader patch on a scene. */
function _registerEnvironmentSkyboxShaderPatch(scene, order, loadPatch) {
	const loaders = scene._environmentSkyboxShaderPatchLoaders ??= [];
	loaders[order] = loadPatch;
	scene._environmentSkyboxShaderComposer ??= async (fragment, kind) => {
		fragment = kind === "hdr" ? SCENE_UBO_WGSL + fragment : fragment;
		for (const load of loaders.slice()) if (load) fragment = (await load())._apply(fragment, kind);
		return fragment;
	};
}
export { _registerEnvironmentSkyboxShaderPatch };

//# sourceMappingURL=environment-skybox-shader-composer.js.map