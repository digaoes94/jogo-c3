import { _installStdVertexColorFragment } from "./standard-pipeline.js";
import { createStdVertexColorFragment } from "./fragments/std-vertex-color-fragment.js";
// src/material/standard/enable-standard-vertex-colors.ts
/**
* Opt-in entry point for StandardMaterial mesh vertex colors.
*
* The explicit enable keeps every Standard scene that does not use vertex colors
* byte-identical: without this module, the fragment factory stays statically null
* and the renderer's color-buffer branches fold away.
*/
/**
* Enable RGBA mesh vertex colors for StandardMaterial.
*
* Call once before `registerScene`. Colored meshes must provide four floats per
* vertex; RGB multiplies the Standard base color and A multiplies material alpha.
*/
function enableStandardVertexColors() {
	_installStdVertexColorFragment(createStdVertexColorFragment);
}
export { enableStandardVertexColors };

//# sourceMappingURL=enable-standard-vertex-colors.js.map