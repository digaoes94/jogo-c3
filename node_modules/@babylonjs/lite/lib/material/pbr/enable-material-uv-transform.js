import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/uv-transform-fragment.js";
// src/material/pbr/enable-material-uv-transform.ts
/** Opt a PBR material into the per-texture UV transform machinery ahead of need.
*
*  Call this before the first build for hand-created materials that use or animate
*  `uScale`/`vScale`/`uAng`/`uOffset`/`vOffset`. The values are read from each texture's
*  own fields at UBO-write time, so this only has to be called once per material —
*  animating those texture fields afterwards needs no further calls, just pair later
*  mutations with `markMaterialUboDirty`. glTF materials are enabled automatically by the
*  loader. Registers the uv-transform extension globally (idempotent).
*
*  Returns `true` when the material has not been built yet, so the flag simply rides the first
*  build. Returns `false` when the material's feature set was already compiled: the flag is set,
*  but applying it needs `rebuildMaterial(scene, material)` — the designed path for post-build
*  feature changes — or nothing visible happens. */
function enableMaterialUvTransform(material) {
	material._hasUvTx = true;
	_registerPbrExt(pbrExt);
	return material._renderFeatures === void 0;
}
export { enableMaterialUvTransform };

//# sourceMappingURL=enable-material-uv-transform.js.map