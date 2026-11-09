import { collectPbrBoundTextures } from "./collect-pbr-bound-textures.js";
import { _computePbrMaterialFeatures } from "./pbr-material-features.js";
import { _installPbrFallbackResolver } from "./pbr-pipeline.js";
import { createSolidTexture2D } from "../../texture/solid-texture.js";
import { getPbrGroupBuilder } from "./pbr-group-builder.js";
// src/material/pbr/pbr-material.ts
/** Create a PbrMaterialProps with optional overrides. */
function createPbrMaterial(props) {
	_installPbrFallbackResolver((engine) => engine._pbrFallbackTex ??= createSolidTexture2D(engine, 1, 1, 1));
	return {
		...props,
		_buildGroup: getPbrGroupBuilder(),
		_uboVersion: 0
	};
}
export { _computePbrMaterialFeatures, collectPbrBoundTextures, createPbrMaterial, getPbrGroupBuilder };

//# sourceMappingURL=pbr-material.js.map