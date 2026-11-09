// src/xr/xr-feature.ts
/**
* Enable a feature on an already-running session at runtime (mirrors Babylon.js
* `enableFeature`). The handle is driven and disposed by the session like any
* feature passed to {@link enterXr}.
*
* Note: a session's native `requiredFeatures`/`optionalFeatures` are fixed at
* `requestSession` time, so `spec.sessionFeatures` is **not** applied here — only
* use `attachXrFeature` for features whose native descriptors were already granted
* (or that need none, like pointer selection).
*
* @param ctx - The active session to attach to.
* @param spec - The feature spec to instantiate.
* @returns The live feature handle.
*/
function attachXrFeature(ctx, spec) {
	const handle = spec.create(ctx);
	ctx._features.push(handle);
	return handle;
}
export { attachXrFeature };

//# sourceMappingURL=xr-feature.js.map