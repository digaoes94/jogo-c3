import { _preloadStdMeshExt } from "./standard/standard-group-builder.js";
import { enableMaterialUvTransform as enableMaterialUvTransform$1 } from "./pbr/enable-material-uv-transform.js";
// src/material/enable-material-uv-transform.ts
function enableMaterialUvTransform(material) {
	if (material._buildGroup?._materialFamily !== "standard") return enableMaterialUvTransform$1(material);
	const std = material;
	if (!std._hasUvTx) std._uvTxExt = _preloadStdMeshExt(() => import("./standard/fragments/std-uv-transform-fragment.js"), "stdUvTransformExt");
	std._hasUvTx = true;
	return std._renderFeatures === void 0;
}
export { enableMaterialUvTransform };

//# sourceMappingURL=enable-material-uv-transform.js.map