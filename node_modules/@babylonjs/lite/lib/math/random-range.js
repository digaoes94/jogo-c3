// src/math/random-range.ts
/**
* Babylon.js `Scalar.RandomRange` semantics: returns `min` **without consuming a random** when
* `min === max`, otherwise `Math.random() * (max - min) + min`.
*
* The short-circuit matters for deterministic parity — callers that draw one random per component
* (such as particle emitter shapes) rely on equal min/max bounds not advancing the seeded RNG
* sequence.
*/
function randomRange(min, max) {
	if (min === max) return min;
	return Math.random() * (max - min) + min;
}
export { randomRange };

//# sourceMappingURL=random-range.js.map