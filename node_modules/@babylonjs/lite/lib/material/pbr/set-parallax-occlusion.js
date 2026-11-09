import { _registerPbrExt } from "./pbr-flags.js";
import { _copyParallaxOcclusionProps } from "../parallax/parallax-occlusion.js";
import { pbrParallaxOcclusionExt } from "./fragments/parallax-occlusion-fragment.js";
// src/material/pbr/set-parallax-occlusion.ts
/** Enable independent contact-refinement POM, or disable it with null.
* Call before registerScene(); texture or active-variant changes require rebuildMaterial().
* Scalar updates to an already-active variant can use markMaterialUboDirty().
* Existing normal maps are sampled at displaced UVs; mesh depth is unchanged. */
function setPbrParallaxOcclusion(material, props) {
	material._parallaxOcclusion = props === null ? void 0 : _copyParallaxOcclusionProps(props);
	_registerPbrExt(pbrParallaxOcclusionExt);
}
export { setPbrParallaxOcclusion };

//# sourceMappingURL=set-parallax-occlusion.js.map