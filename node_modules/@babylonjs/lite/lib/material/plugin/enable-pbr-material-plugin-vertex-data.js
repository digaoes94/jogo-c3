import { _registerPbrExt } from "../pbr/pbr-flags.js";
import { registerPbrVertexPlugins } from "./pbr-plugin-vertex-bridge.js";
// src/material/plugin/enable-pbr-material-plugin-vertex-data.ts
/** Enable PBR material plugins that declare custom varyings or vertex-visible uniforms, textures, and samplers. */
function enablePbrMaterialPluginVertexData() {
	registerPbrVertexPlugins(_registerPbrExt);
}
export { enablePbrMaterialPluginVertexData };

//# sourceMappingURL=enable-pbr-material-plugin-vertex-data.js.map