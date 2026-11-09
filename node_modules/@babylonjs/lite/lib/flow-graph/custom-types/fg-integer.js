// src/flow-graph/custom-types/fg-integer.ts
/** Construct an `FgInteger`, normalizing to a 32-bit signed integer. */
function fgInt(n) {
	return {
		value: n | 0,
		__fgInt: true
	};
}
/** Type guard for `FgInteger`. */
function isFgInt(v) {
	return typeof v === "object" && v !== null && v.__fgInt === true;
}
export { fgInt, isFgInt };

//# sourceMappingURL=fg-integer.js.map