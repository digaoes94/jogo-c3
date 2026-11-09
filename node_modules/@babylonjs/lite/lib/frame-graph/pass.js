// src/frame-graph/pass.ts
/** Add one or more render-target dependencies to the pass. Idempotent
*  (Set semantics). Mirrors BJS `FrameGraphRenderPass.addDependencies`,
*  promoted onto the base `Pass` because every future pass type
*  (compute / copy / object-list) needs the same surface. */
function addPassDependencies(pass, deps) {
	if (Array.isArray(deps)) for (const dep of deps) pass._dependencies.add(dep);
	else pass._dependencies.add(deps);
}
/** Set the per-frame body of the pass. Mirrors BJS `setExecuteFunc`. */
function setRenderPassExecuteFunc(pass, fn) {
	pass._executeFunc = fn;
}
/** Set optional per-frame preparation that runs before the pass body. */
function setRenderPassBeforeExecute(pass, fn) {
	pass._beforeExecute = fn;
}
export { addPassDependencies, setRenderPassBeforeExecute, setRenderPassExecuteFunc };

//# sourceMappingURL=pass.js.map