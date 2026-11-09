import { _registerStdExt } from "./standard-flags.js";
import { stdCubeReflectionExt } from "./fragments/std-cube-reflection-fragment.js";
// src/material/standard/set-std-cube-reflection.ts
/** Set the cube reflection texture on `mat` (environment reflection sampled along the
*  view-reflection vector). Reads `mat.reflectionLevel` for intensity. Registers the
*  cube-reflection extension globally (idempotent). Call before the scene is first
*  built.
*
*  Obtain `texture` from `loadCubeTexture()`:
*
* ```ts
* setStandardReflectionCubeTexture(mat, await loadCubeTexture(engine, "/env/sky"));
* ```
*/
function setStandardReflectionCubeTexture(mat, texture) {
	mat._reflectionCubeTexture = texture;
	_registerStdExt(stdCubeReflectionExt);
}
export { setStandardReflectionCubeTexture };

//# sourceMappingURL=set-std-cube-reflection.js.map