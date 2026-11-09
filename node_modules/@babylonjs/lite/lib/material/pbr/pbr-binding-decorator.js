// src/material/pbr/pbr-binding-decorator.ts
/** @internal The unused live binding is constant null after tree-shaking. */
var pbrBindingDecorator = null;
/** @internal Isolated from the lazy builder's namespace exports. */
function installPbrBindingDecorator(decorator) {
	pbrBindingDecorator = decorator;
}
export { installPbrBindingDecorator, pbrBindingDecorator };

//# sourceMappingURL=pbr-binding-decorator.js.map