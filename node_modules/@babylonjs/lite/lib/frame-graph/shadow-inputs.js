// src/frame-graph/shadow-inputs.ts
var shadowTaskInputs = null;
var shadowTaskInputPreloader = null;
function getShadowTaskInputs() {
	shadowTaskInputs ??= /* @__PURE__ */ new WeakMap();
	return shadowTaskInputs;
}
/** Register scene-owned shadow caster inputs for a generator. */
function setShadowTaskCasterMeshes(shadowGenerator, casterMeshes) {
	getShadowTaskInputs().set(shadowGenerator, casterMeshes);
	if (!shadowTaskInputPreloader) return;
	shadowTaskInputPreloader(shadowGenerator, casterMeshes).catch((error) => console.error(error));
}
/** @internal */
function _getShadowTaskCasterMeshes(shadowGenerator) {
	return shadowTaskInputs?.get(shadowGenerator);
}
/**
* Cap the cascades a caster mesh renders into: the mesh casts only into cascade layers `0..maxCascade`
* (0 = the nearest). Lets a scene keep small casters out of the far cascades, where their shadows are
* sub-texel anyway — each excluded layer saves that caster's draw + pipeline switch per frame.
*
* Unset (the default) casts into every cascade. Pass `Infinity` to restore that.
* The cap is read when a generator's caster set is (re)supplied through
* {@link setShadowTaskCasterMeshes}; to change it for an already-registered caster, re-supply the
* caster list (a new array) afterwards. Non-cascaded (single-map) generators ignore the cap.
*/
function setShadowCasterMaxCascade(mesh, maxCascade) {
	if (maxCascade !== Infinity && (!Number.isInteger(maxCascade) || maxCascade < 0)) throw new RangeError("setShadowCasterMaxCascade requires a non-negative integer or Infinity");
	mesh._shadowMaxCascade = maxCascade === Infinity ? void 0 : maxCascade;
}
/** @internal Cascade cap for a caster mesh (see {@link setShadowCasterMaxCascade}); Infinity when unset. */
function _getShadowCasterMaxCascade(mesh) {
	return mesh._shadowMaxCascade ?? Infinity;
}
/** @internal */
function _setShadowTaskInputPreloader(preloader) {
	shadowTaskInputPreloader = preloader;
}
export { _getShadowCasterMaxCascade, _getShadowTaskCasterMeshes, _setShadowTaskInputPreloader, setShadowCasterMaxCascade, setShadowTaskCasterMeshes };

//# sourceMappingURL=shadow-inputs.js.map