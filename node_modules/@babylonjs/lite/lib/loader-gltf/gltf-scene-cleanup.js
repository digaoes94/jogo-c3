// src/loader-gltf/gltf-scene-cleanup.ts
/** @internal Register one feature-owned cleanup for a container in a scene. */
function _registerAssetContainerSceneCleanup(container, scene, cleanup) {
	const cleanups = container._sceneCleanups ??= /* @__PURE__ */ new WeakMap();
	const previous = cleanups.get(scene);
	const combined = previous ? () => {
		previous();
		cleanup();
	} : cleanup;
	if (previous) scene._disposables[scene._disposables.indexOf(previous)] = combined;
	else scene._disposables.push(combined);
	cleanups.set(scene, combined);
}
export { _registerAssetContainerSceneCleanup };

//# sourceMappingURL=gltf-scene-cleanup.js.map