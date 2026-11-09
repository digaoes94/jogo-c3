import { _registerStdExt } from "./standard-flags.js";
import { _copyParallaxOcclusionProps } from "../parallax/parallax-occlusion.js";
import { stdParallaxOcclusionExt } from "./fragments/std-parallax-occlusion-fragment.js";
// src/material/standard/set-std-parallax-occlusion.ts
/** Enable independent contact-refinement POM on Standard surface textures, or disable it with null.
* Call before registerScene(); later changes require rebuildMaterial().
* Existing bump-map frames, mesh depth, and shadow casting are unchanged. */
function setStandardParallaxOcclusion(material, props) {
	material._parallaxOcclusion = props === null ? void 0 : _copyParallaxOcclusionProps(props);
	_registerStdExt(stdParallaxOcclusionExt);
}
export { setStandardParallaxOcclusion };

//# sourceMappingURL=set-std-parallax-occlusion.js.map