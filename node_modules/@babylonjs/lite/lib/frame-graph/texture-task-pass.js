// src/frame-graph/texture-task-pass.ts
/** @internal Record texture work whose preparation must run after all target allocations. */
function createTextureTaskPass(task, initialize, execute, dispose) {
	const pass = {
		name: task.name,
		_parentTask: task,
		_dependencies: /* @__PURE__ */ new Set(),
		_executeFunc: null,
		_beforeExecute: null,
		_initialize: initialize,
		_execute() {
			pass._beforeExecute?.();
			return execute();
		},
		_dispose() {
			dispose();
			pass._dependencies.clear();
			pass._executeFunc = null;
			pass._beforeExecute = null;
		}
	};
	task._passes.push(pass);
	return pass;
}
export { createTextureTaskPass };

//# sourceMappingURL=texture-task-pass.js.map