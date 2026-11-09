// src/mesh-lod/mesh-lod-errors.ts
/** Construct a {@link MeshLoDError} with a stable code and optional context.
*  The `message` argument is a runtime value (not a string literal), so the
*  error-string build plugin leaves it in place. */
function createMeshLoDError(code, message, context) {
	const error = new Error(message);
	error.name = "MeshLoDError";
	error.code = code;
	if (context) Object.assign(error, context);
	return error;
}
/** Type guard for {@link MeshLoDError}. True for any `Error` carrying an
*  `MLOD_`-prefixed string `code`. */
function isMeshLoDError(error) {
	return error instanceof Error && typeof error.code === "string" && error.code.startsWith("MLOD_");
}
export { createMeshLoDError, isMeshLoDError };

//# sourceMappingURL=mesh-lod-errors.js.map