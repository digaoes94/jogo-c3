// src/math/maximize-mat4-in-place.ts
/**
* Replaces every element of `target` with the larger value from `target` and
* `other`.
*/
function maximizeMat4InPlace(target, other) {
	const storage = target;
	for (let index = 0; index < 16; index++) storage[index] = Math.max(storage[index], other[index]);
	return target;
}
export { maximizeMat4InPlace };

//# sourceMappingURL=maximize-mat4-in-place.js.map