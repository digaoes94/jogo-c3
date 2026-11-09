import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/reflectance-fragment.js";
// src/material/pbr/set-metallic-reflectance.ts
/** Apply dielectric reflectance controls to `mat`. Registers the reflectance extension
*  globally (idempotent). Call before the scene is first built. */
function setPbrMetallicReflectance(mat, options) {
	if (options.color) mat._metallicReflectanceColor = options.color;
	if (options.texture) mat._metallicReflectanceTexture = options.texture;
	if (options.reflectanceTexture) mat._reflectanceTexture = options.reflectanceTexture;
	if (options.f0Factor !== void 0) mat._metallicF0Factor = options.f0Factor;
	if (options.specularWeight !== void 0) mat._specularWeight = options.specularWeight;
	if (options.useOnlyMetallicFromTexture !== void 0) mat._useOnlyMetallicFromMetallicReflectanceTexture = options.useOnlyMetallicFromTexture;
	_registerPbrExt(pbrExt);
}
export { setPbrMetallicReflectance };

//# sourceMappingURL=set-metallic-reflectance.js.map