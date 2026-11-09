// src/text/load-font-weight-offset.ts
/**
* Load the synthetic font-weight setter without dynamically importing the package barrel.
*
* The exact internal import keeps the opt-in shader feature isolated in its lazy chunk
* while the package continues to expose a single root entry point.
*/
async function loadFontWeightOffset() {
	return (await import("./set-font-weight-offset.js")).setFontWeightOffset;
}
export { loadFontWeightOffset };

//# sourceMappingURL=load-font-weight-offset.js.map