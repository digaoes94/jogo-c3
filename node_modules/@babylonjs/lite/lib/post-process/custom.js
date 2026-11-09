import { createPostProcessTask } from "../frame-graph/post-process-task.js";
// src/post-process/custom.ts
/**
* Create a custom fullscreen task over RenderTarget inputs. Schedule all input producers before it;
* rebuild the graph after attachment replacement or resize. Shader/layout configuration is fixed for
* the task's lifetime. Disposal preserves input targets and a caller-supplied output target.
*/
function createCustomPostProcessTask(config, engine, scene) {
	return createPostProcessTask({
		...config,
		_shader: config
	}, engine, scene);
}
export { createCustomPostProcessTask };

//# sourceMappingURL=custom.js.map