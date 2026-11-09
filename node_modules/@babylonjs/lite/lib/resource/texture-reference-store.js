// src/resource/texture-reference-store.ts
var _textureReferences = null;
/** @internal Shared lazy reference-count store for raw and facade texture owners. */
function getTextureReferenceStore() {
	return _textureReferences ??= /* @__PURE__ */ new WeakMap();
}
/** @internal Read retained lifetime state without creating the lazy store. */
function _getTextureReferenceCount(texture) {
	return _textureReferences?.get(texture);
}
export { _getTextureReferenceCount, getTextureReferenceStore };

//# sourceMappingURL=texture-reference-store.js.map