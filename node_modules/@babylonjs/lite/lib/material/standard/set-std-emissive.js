import { _registerStdExt } from "./standard-flags.js";
import { stdEmissiveExt } from "./fragments/std-emissive-fragment.js";
// src/material/standard/set-std-emissive.ts
/** Set the emissive texture on `mat`; its sample is added to `mat.emissiveColor`. A
*  depth-sampled texture (`_sampleType === "depth"`) automatically switches the binding
*  to unfilterable-float with a non-filtering sampler. Registers the emissive extension
*  globally (idempotent). Call before the scene is first built. */
function setStandardEmissiveTexture(mat, texture) {
	mat._emissiveTexture = texture;
	_registerStdExt(stdEmissiveExt);
}
export { setStandardEmissiveTexture };

//# sourceMappingURL=set-std-emissive.js.map