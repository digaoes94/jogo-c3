import { installBindingExtension } from "./binding-extension.js";
// src/shader/read-only-storage-binding.ts
var emitReadOnlyStorageBinding = (binding, layout) => {
	if (binding._type._kind === "read-only-storage-buffer") {
		layout.buffer = { type: "read-only-storage" };
		return {
			_qualifier: "<storage, read>",
			_declarationType: `${binding._name}Uniforms`
		};
	}
};
/** @internal Construct typed storage metadata and install its WGSL/layout emitter together. */
function createReadOnlyStorageBinding(name, visibility) {
	installBindingExtension(emitReadOnlyStorageBinding);
	return {
		_name: name,
		_type: { _kind: "read-only-storage-buffer" },
		_visibility: visibility
	};
}
export { createReadOnlyStorageBinding };

//# sourceMappingURL=read-only-storage-binding.js.map