import { _registerPbrExt } from "./pbr-flags.js";
import { pbrExt } from "./fragments/shadow-only-fragment.js";
// src/material/pbr/set-shadow-only.ts
/** Turn `mat` into a shadow-only receiver: the surface is invisible except where a
*  shadow is cast on it, where it appears in `options.color` (black by default).
*  Mirrors BJS `BackgroundMaterial.shadowOnly`. Requires `receiveShadows` on the mesh
*  and at least one shadow-casting light. Call on the material returned by
*  `createPbrMaterial` (or on the props before creating it). */
function setShadowOnly(mat, options) {
	mat._shadowOnly = true;
	if (options?.color) mat._shadowOnlyColor = options.color;
	if (options?.opacity !== void 0) mat._shadowOnlyOpacity = options.opacity;
	if (options?.falloff !== void 0) mat._shadowOnlyFalloff = options.falloff;
	_registerPbrExt(pbrExt);
}
export { setShadowOnly };

//# sourceMappingURL=set-shadow-only.js.map