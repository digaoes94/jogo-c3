import { F32 } from "../engine/typed-arrays.js";
// src/math/_matrix-allocator.ts
/** @internal Matrix allocator with strict lazy init. Zero work happens at
*  module load — `_allocate` starts undefined; the first call to
*  `allocateMat4()` resolves the default (F32) allocator. When
*  `_setHpmAllocator` is called (by `createEngine` with HPM=true), it
*  installs the F64 allocator imported from `_mat4-storage-f64.ts`.
*
*  **Constraint (known limitation):** the allocator is process-global.
*  Pages that mix HPM and non-HPM engines are unsupported — the second
*  engine silently inherits the first engine's storage precision. See
*  `docs/lite/architecture/36-high-precision-matrix.md` for the rationale.
*
*  This pattern replaces the per-engine `_matrixPolicy` field that previously
*  threaded the allocator through every entity factory and loader. Removing
*  the field shaves ~300-500 bytes per scene (no more closure captures,
*  no `LoaderScratch` struct, no `engine.` prefix at every allocation site). */
function _defaultAllocate() {
	return new F32(16);
}
var _allocate;
/** Allocate a fresh zero-initialized 16-element `Mat4`. Returns an F32 array by
*  default, or F64 if any engine on the page was created with
*  `useHighPrecisionMatrix: true`. */
function allocateMat4() {
	return (_allocate ?? _defaultAllocate)();
}
/** Allocate a fresh zero-initialized 16-element `Mat4`, typed as `Mat4Storage` for
*  kernels/factories that write into it by index. Centralizes the
*  `allocateMat4() as unknown as Mat4Storage` cast repeated at every mat4-factory
*  call site. */
function allocateMat4Storage() {
	return allocateMat4();
}
/** @internal Install the HPM (F64) allocator. Called once by `createEngine`
*  when `useHighPrecisionMatrix: true`. Subsequent calls overwrite. */
function _setHpmAllocator(allocate) {
	_allocate = allocate;
}
/** @internal Reset the allocator to the F32 default. Test-only — production
*  code never reverts precision. */
function _resetMatrixAllocatorForTests() {
	_allocate = void 0;
}
export { _resetMatrixAllocatorForTests, _setHpmAllocator, allocateMat4, allocateMat4Storage };

//# sourceMappingURL=_matrix-allocator.js.map