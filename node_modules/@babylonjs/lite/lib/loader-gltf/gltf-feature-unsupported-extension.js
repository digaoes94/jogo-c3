import { _registerEnabledGltfFeature } from "./gltf-feature-hooks.js";
// src/loader-gltf/gltf-feature-unsupported-extension.ts
/** Register an opt-in material-extension guard that fails only when an asset uses the named extension. */
function enableUnsupportedGltfMaterialExtension(extensionName, fail) {
	_registerEnabledGltfFeature((json) => json.extensionsUsed?.includes(extensionName) === true, {
		id: extensionName,
		async applyMaterial(material) {
			if (material._rawMatDef?.extensions?.[extensionName]) fail();
			return null;
		}
	});
}
export { enableUnsupportedGltfMaterialExtension };

//# sourceMappingURL=gltf-feature-unsupported-extension.js.map