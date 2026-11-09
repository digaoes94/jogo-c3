// src/frame-graph/compute-pass.ts
/** @internal Create an empty compute pass owned by `task`. */
function createComputePass(name, task) {
	const pass = {
		name,
		_parentTask: task,
		_dependencies: /* @__PURE__ */ new Set(),
		_executeFunc: null,
		_computeExecute: null,
		_executeEnabled: null,
		_beforeExecute: null,
		_initialize() {},
		_execute() {
			if (pass._executeEnabled && !pass._executeEnabled()) return 0;
			pass._beforeExecute?.();
			const encoder = pass._parentTask.engine._currentEncoder.beginComputePass({ label: pass.name });
			pass._computeExecute?.(encoder);
			encoder.end();
			return 0;
		},
		_dispose() {
			pass._executeFunc = null;
			pass._computeExecute = null;
			pass._executeEnabled = null;
			pass._beforeExecute = null;
			pass._dependencies.clear();
		}
	};
	task._passes[0] = pass;
	return pass;
}
/** @internal Set the per-frame body of a compute pass. */
function setComputePassExecuteFunc(pass, fn) {
	pass._computeExecute = fn;
}
/** @internal Set a preflight predicate that skips the whole pass when no work is active. */
function setComputePassExecuteEnabled(pass, enabled) {
	pass._executeEnabled = enabled;
}
export { createComputePass, setComputePassExecuteEnabled, setComputePassExecuteFunc };

//# sourceMappingURL=compute-pass.js.map