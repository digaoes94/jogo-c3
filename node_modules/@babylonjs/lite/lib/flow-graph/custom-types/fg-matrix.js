// src/flow-graph/custom-types/fg-matrix.ts
/** Construct an `FgMatrix2D` from 4 column-major elements (defaults to identity). */
function fgMatrix2D(elements) {
	const m = /* @__PURE__ */ new Float32Array(4);
	if (elements) m.set(elements);
	else {
		m[0] = 1;
		m[3] = 1;
	}
	return {
		m,
		__fgMat: 2
	};
}
/** Construct an `FgMatrix3D` from 9 column-major elements (defaults to identity). */
function fgMatrix3D(elements) {
	const m = /* @__PURE__ */ new Float32Array(9);
	if (elements) m.set(elements);
	else {
		m[0] = 1;
		m[4] = 1;
		m[8] = 1;
	}
	return {
		m,
		__fgMat: 3
	};
}
/** Type guard for `FgMatrix2D`. */
function isFgMatrix2D(v) {
	return typeof v === "object" && v !== null && v.__fgMat === 2;
}
/** Type guard for `FgMatrix3D`. */
function isFgMatrix3D(v) {
	return typeof v === "object" && v !== null && v.__fgMat === 3;
}
export { fgMatrix2D, fgMatrix3D, isFgMatrix2D, isFgMatrix3D };

//# sourceMappingURL=fg-matrix.js.map