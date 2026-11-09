import { _registerPbrExt } from "../pbr/pbr-flags.js";
import { getMaterialSource } from "../material-view.js";
import { _registerStdExt } from "../standard/standard-flags.js";
import { enqueueMaterialSwap } from "../../scene/mesh-scene-registry.js";
import { processMaterialSwaps } from "../../scene/scene-material-swap.js";
import { getStandardGroupBuilder } from "../standard/standard-group-builder.js";
import { registerPbrPlugins } from "./pbr-plugin-bridge.js";
import { bakeStdPluginMaterial, registerStdPluginBridge, registerStdPlugins } from "./std-plugin-bridge.js";
// src/material/plugin/enable-material-plugins.ts
function isStandardMaterial(material) {
	return material._buildGroup === getStandardGroupBuilder();
}
function installRefresh(scene, refresh) {
	const previous = scene._beforeRender.indexOf(refresh);
	if (previous >= 0) scene._beforeRender.splice(previous, 1);
	scene._beforeRender.push(refresh);
}
/**
* Enable material-plugin support for `scene`.
*
* - Registers the PBR plugin bridge: its `detect` hook assigns a stable signature
*   identity outside the material's feature bits during the build, so no mesh
*   walk is needed here.
* - Registers the Standard plugin bridge and walks `scene.meshes`, pre-baking a
*   per-signature identity into every Standard plugin material's `_pi`.
*   Only a presence flag enters per-renderable features. Standard plugin uniforms are delivered
*   through a self-managed uniform buffer built here and bound via the
*   pre-existing `StdExt._bind` loop.
*/
function enableMaterialPlugins(scene) {
	registerPbrPlugins(_registerPbrExt);
	installRefresh(scene, registerStdPlugins(scene, _registerStdExt));
}
/**
* Reconcile a plugin material after its shader-affecting state changes in a live scene.
*
* The bridge is enabled before the material's renderables are rebuilt. Standard
* materials are baked by {@link enableMaterialPlugins}; PBR materials receive their
* stable signature index while the queued renderable rebuild runs.
*/
async function reconcileMaterialPlugins(scene, material) {
	registerPbrPlugins(_registerPbrExt);
	installRefresh(scene, registerStdPluginBridge(scene, _registerStdExt));
	const source = getMaterialSource(material);
	source._renderFeatures = void 0;
	if (isStandardMaterial(source)) bakeStdPluginMaterial(source, scene);
	for (const mesh of scene.meshes) if (mesh.material && getMaterialSource(mesh.material) === source) enqueueMaterialSwap(scene, mesh);
	const pending = processMaterialSwaps(scene);
	if (pending) await pending;
}
export { enableMaterialPlugins, reconcileMaterialPlugins };

//# sourceMappingURL=enable-material-plugins.js.map