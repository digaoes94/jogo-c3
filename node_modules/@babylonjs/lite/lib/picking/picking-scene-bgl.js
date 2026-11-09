import { SS } from "../engine/gpu-flags.js";
import { createSingleUniformBGL } from "../shader/bgl-helpers.js";
// src/picking/picking-scene-bgl.ts
var _device = null;
var _layout = null;
function getPickingSceneBGL(engine) {
	if (_device !== engine._device) {
		_device = engine._device;
		_layout = null;
	}
	return _layout ??= createSingleUniformBGL(engine, "picking-scene-bgl", SS.VERTEX | SS.FRAGMENT);
}
export { getPickingSceneBGL };

//# sourceMappingURL=picking-scene-bgl.js.map