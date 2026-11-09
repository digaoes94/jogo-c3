// src/flow-graph/sockets.ts
/** Declare a data INPUT socket (optional literal fallback). */
function sockIn(name, type, defaultValue) {
	return defaultValue === void 0 ? {
		name,
		type
	} : {
		name,
		type,
		defaultValue
	};
}
/** Declare a data OUTPUT socket. */
function sockOut(name, type) {
	return {
		name,
		type
	};
}
/** Declare a signal INPUT socket. */
function sigIn(name) {
	return {
		name,
		targets: []
	};
}
/** Declare a signal OUTPUT socket. */
function sigOut(name) {
	return {
		name,
		targets: []
	};
}
export { sigIn, sigOut, sockIn, sockOut };

//# sourceMappingURL=sockets.js.map