// src/material/node/blocks/_block-api.ts
/** Mint a new SSA-style temporary name. */
function nextTemp(state, prefix = "t") {
	return `_${prefix}${state.nextTemp++}`;
}
export { nextTemp };

//# sourceMappingURL=_block-api.js.map