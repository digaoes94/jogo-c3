import { _registerStdExt } from "./standard-flags.js";
// src/material/standard/standard-group-builder.ts
var sceneHooks = null;
/** @internal Explicitly installed scene contributions disappear from consumers without the enabler. */
function _installStandardSceneHooks(hooks) {
	sceneHooks = hooks;
}
var _stdMeshExtPreloads = null;
/** @internal Eagerly import + globally register an opt-in Standard mesh-feature ext so
*  it is available for both the initial build and any later synchronous rebuild. */
function _preloadStdMeshExt(load, key) {
	const promise = load().then((mod) => {
		_registerStdExt(mod[key]);
	});
	(_stdMeshExtPreloads ??= []).push(promise);
	return promise;
}
/** Lazily-created singleton standard-material {@link MeshGroupBuilder}. Lazy-init
*  keeps the module free of top-level side effects so a scene that uses no standard
*  material tree-shakes the builder (and its renderable graph) away. */
var _standardGroupBuilder = null;
function getStandardGroupBuilder() {
	if (_standardGroupBuilder) return _standardGroupBuilder;
	const builder = async (scene, meshes) => {
		if (sceneHooks) await sceneHooks.prepare(scene);
		const hasTI = meshes.some((m) => !!m.thinInstances);
		const hasCulling = meshes.some((m) => !!m.thinInstances?._gpuCullingEnabled);
		const hasShadow = meshes.some((m) => m.receiveShadows) && scene.lights.some((l) => !!l.shadowGenerator);
		const hasMorph = meshes.some((m) => !!m.morphTargets);
		let tiSync;
		let tiUpdate;
		let tiFragment;
		let shadow;
		let morphFragment;
		let cull;
		let fogFragment = null;
		const imports = [];
		if (hasTI) {
			imports.push(import("../../mesh/thin-instance-gpu.js").then((m) => {
				tiSync = m.syncThinInstanceBuffers;
				tiUpdate = m.syncThinInstanceForDraw;
			}), import("../../shader/fragments/thin-instance-fragment.js").then((m) => {
				tiFragment = m.createThinInstanceFragment;
			}));
			if (hasCulling) imports.push(import("../../mesh/thin-instance-cull-binding.js").then((m) => {
				cull = m;
			}));
		}
		if (hasShadow) imports.push(import("./fragments/std-shadow-fragment.js").then((m) => m.createStandardShadowContext(scene.surface.engine, scene.lights)).then((context) => {
			shadow = context;
		}));
		if (hasMorph) imports.push(import("../../shader/fragments/morph-fragment-core.js").then((m) => {
			morphFragment = m.createMorphFragment;
		}));
		if (scene.fog) imports.push(import("./std-fog-wgsl.js").then((m) => {
			fogFragment = m.createStandardFogFragment();
		}));
		if (_stdMeshExtPreloads) for (const preload of _stdMeshExtPreloads) imports.push(preload);
		if (imports.length > 0) await Promise.all(imports);
		const renderableMod = await import("./standard-renderable.js");
		const sceneShader = sceneHooks?.context(scene, fogFragment) ?? (scene.fog ? {
			_features: 1,
			_fragments: [fogFragment]
		} : null);
		const result = renderableMod.buildStandardMeshRenderables(scene, meshes, {
			tiSync,
			tiUpdate,
			tiFragment,
			shadow,
			morphFragment,
			cull,
			sceneShader
		});
		builder._rebuildSingle = result.rebuildSingle;
		return result;
	};
	builder._materialFamily = "standard";
	return _standardGroupBuilder = builder;
}
export { _installStandardSceneHooks, _preloadStdMeshExt, getStandardGroupBuilder };

//# sourceMappingURL=standard-group-builder.js.map