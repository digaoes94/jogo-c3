import { createIdentityMat4 } from "./create-identity-mat4.js";
// src/math/create-translation-mat4.ts
/** Create a translation matrix. */
function createTranslationMat4(x, y, z) {
	const out = createIdentityMat4();
	const s = out;
	s[12] = x;
	s[13] = y;
	s[14] = z;
	return out;
}
export { createTranslationMat4 };

//# sourceMappingURL=create-translation-mat4.js.map