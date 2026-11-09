import { allocateMat4 } from "./_matrix-allocator.js";
// src/math/create-identity-mat4.ts
/** Create a new identity Mat4. */
function createIdentityMat4() {
	const m = allocateMat4();
	m[0] = 1;
	m[5] = 1;
	m[10] = 1;
	m[15] = 1;
	return m;
}
export { createIdentityMat4 };

//# sourceMappingURL=create-identity-mat4.js.map