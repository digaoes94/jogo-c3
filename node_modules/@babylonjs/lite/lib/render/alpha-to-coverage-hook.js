// src/render/alpha-to-coverage-hook.ts
var _resolver = null;
/** @internal Install the resolver when the public A2C setter is first used. */
function _registerAlphaToCoverageResolver(resolver) {
	_resolver = resolver;
}
/** @internal Return the optional resolver, or null when A2C is absent from the application. */
function _getAlphaToCoverageResolver() {
	return _resolver;
}
export { _getAlphaToCoverageResolver, _registerAlphaToCoverageResolver };

//# sourceMappingURL=alpha-to-coverage-hook.js.map