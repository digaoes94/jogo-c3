// src/shader/binding-extension.ts
/** @internal Ordinary shaders retain only the built-in binding kinds. */
var bindingExtension = null;
/** @internal */
function installBindingExtension(extension) {
	bindingExtension = extension;
}
export { bindingExtension, installBindingExtension };

//# sourceMappingURL=binding-extension.js.map