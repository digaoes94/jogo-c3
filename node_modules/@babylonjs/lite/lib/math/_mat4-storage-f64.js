import { F64 } from "../engine/typed-arrays.js";
// src/math/_mat4-storage-f64.ts
/** @internal Build-time tag string used by `tests/bundle-content-no-f64.test.ts`
*  to assert this module is absent from HPM-off bundles. Bundlers (terser,
*  esbuild) do not rename string contents, so this constant survives
*  minification verbatim and is a reliable presence-marker.
*
*  Embedded as a property assignment on the exported function below — terser
*  treats property assignments on exported bindings as observable side effects
*  and preserves them. A `void` expression-statement (e.g. `void TAG;`) does
*  NOT survive minification because the result is unused and the read can be
*  proven side-effect-free. */
var MAT4_STORAGE_F64_BUILD_TAG = "@@MAT4_STORAGE_F64@@";
/** @internal F64-backed Mat4 allocator. Only imported by createEngine
*  inside `if (options.useHighPrecisionMatrix)` (dynamic `await import`).
*  Tree-shaken out of HPM-off bundles. This module is the ONLY place in the
*  package that names `new Float64Array(16)`. */
function allocateF64Mat4() {
	return new F64(16);
}
allocateF64Mat4[MAT4_STORAGE_F64_BUILD_TAG] = true;
export { MAT4_STORAGE_F64_BUILD_TAG, allocateF64Mat4 };

//# sourceMappingURL=_mat4-storage-f64.js.map