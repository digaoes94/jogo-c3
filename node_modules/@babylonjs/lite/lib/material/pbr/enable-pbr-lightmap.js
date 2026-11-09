import { _registerPbrExt } from "./pbr-flags.js";
// src/material/pbr/enable-pbr-lightmap.ts
/** Bit 64 of `_uv2Mask` — the lightmap's TEXCOORD_1 claim. Bits 1…32 are the glTF
*  slow-path channel bits (baseColor…occlusion); see `pbr-template-ext.ts`. Setting it
*  is what makes the always-loaded core plumb the uv2 attribute + varying through, with
*  no lightmap-specific branch in `pbr-renderable.ts`. */
var UV2_MASK_LIGHTMAP = 64;
var _enabled = null;
/**
* Enable PBR lightmap support. Idempotent; **await it before `registerScene`** so the
* extension is registered before the first pipeline is composed.
*/
function enablePbrLightmap() {
	return _enabled ??= import("./fragments/lightmap-fragment.js").then((mod) => {
		_registerPbrExt(mod.pbrExt);
	});
}
/**
* Assign a baked lightmap to a PBR material. Requires {@link enablePbrLightmap}.
*
* Prefer this over setting `material.lightmapTexture` directly: for `coordIndex: 1` it
* also records the material's TEXCOORD_1 claim, which is what drives the uv2 vertex
* attribute and varying.
* @param material - Target PBR material.
* @param texture - The baked lightmap. Effective V orientation combines `texture.invertY`
* with the Babylon.js `texture.uAng === Math.PI` convention.
* @param options - Blend/decode options.
*/
function setPbrLightmap(material, texture, options) {
	const coordIndex = options?.coordIndex ?? 1;
	material.lightmapTexture = texture;
	material.lightmapLevel = options?.level ?? 1;
	material.lightmapCoordIndex = coordIndex;
	material.useLightmapAsShadowmap = options?.useAsShadowmap;
	material.gammaLightmap = options?.gamma;
	const m = material;
	m._uv2Mask = coordIndex === 1 ? (m._uv2Mask ?? 0) | UV2_MASK_LIGHTMAP : (m._uv2Mask ?? 0) & -65;
}
export { enablePbrLightmap, setPbrLightmap };

//# sourceMappingURL=enable-pbr-lightmap.js.map