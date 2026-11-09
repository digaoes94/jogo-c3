import { _createComputeBindingDecl, _installComputeBindingResolver } from "./compute-binding.js";
import { _getComputeBufferBindingResource, _resolveComputeBufferBinding } from "./compute-buffer-binding.js";
import { _hasUniformBuffer } from "./compute-uniform-buffer.js";
// src/compute/compute-uniform-buffer-binding.ts
var UNIFORM_BUFFER_KIND = 2;
function isUniformBuffer(value) {
	return !("_usage" in value);
}
function resolveUniformBuffer(engine, decl, resource) {
	const data = decl._data;
	const alignment = Number(engine._device.limits.minUniformBufferOffsetAlignment) || 1;
	const maxBindingSize = Number(engine._device.limits.maxUniformBufferBindingSize) || Number.MAX_SAFE_INTEGER;
	return _resolveComputeBufferBinding(engine, decl, resource, isUniformBuffer, () => true, false, data.dynamic, data.minSize, maxBindingSize, alignment);
}
function getUniformBuffer(engine, state) {
	return _getComputeBufferBindingResource(engine, state, (owner, buffer) => _hasUniformBuffer(owner, buffer));
}
/** Declare a uniform-buffer binding and opt the shader into uniform-buffer support. */
function computeUniformBufferBinding(name, options) {
	_installComputeBindingResolver(UNIFORM_BUFFER_KIND, resolveUniformBuffer, getUniformBuffer);
	return _createComputeBindingDecl(name, options.group, options.binding, UNIFORM_BUFFER_KIND, { buffer: {
		type: "uniform",
		hasDynamicOffset: options.dynamicOffset === true,
		...options.minBindingSize !== void 0 ? { minBindingSize: options.minBindingSize } : {}
	} }, {
		dynamic: options.dynamicOffset === true,
		minSize: options.minBindingSize ?? 0
	});
}
export { computeUniformBufferBinding };

//# sourceMappingURL=compute-uniform-buffer-binding.js.map