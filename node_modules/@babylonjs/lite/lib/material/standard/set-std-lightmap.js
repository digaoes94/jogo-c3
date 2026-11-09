import { _registerStdExt } from "./standard-flags.js";
import { stdLightmapExt } from "./fragments/std-lightmap-fragment.js";
// src/material/standard/set-std-lightmap.ts
/** Set the lightmap texture on `mat`. Added to the final color by default, or
*  multiplied into it when `mat.useLightmapAsShadowmap` is true. Reads
*  `mat.lightmapLevel` for intensity and `mat.lightmapCoordIndex` to select UV1 (0) or
*  UV2 (1, the BJS default). A texture with `uAng === Math.PI` is sampled V-flipped.
*  Registers the lightmap extension globally (idempotent). Call before the scene is
*  first built. */
function setStandardLightmapTexture(mat, texture) {
	mat._lightmapTexture = texture;
	_registerStdExt(stdLightmapExt);
}
export { setStandardLightmapTexture };

//# sourceMappingURL=set-std-lightmap.js.map