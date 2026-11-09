// src/material/shader/shader-vb-support.ts
var _support = null;
/** @internal */
function _getShaderVbSupport() {
	return _support;
}
/** @internal Installed synchronously by the storage/format opt-in module. */
function _installShaderVbSupport(support) {
	_support = support;
}
var float2 = {
	_stride: 8,
	_format: "float32x2",
	_type: "vec2<f32>"
};
var float3 = {
	_stride: 12,
	_format: "float32x3",
	_type: "vec3<f32>"
};
var float4 = {
	_stride: 16,
	_format: "float32x4",
	_type: "vec4<f32>"
};
var uint4 = {
	_stride: 16,
	_format: "uint32x4",
	_type: "vec4<u32>"
};
var attributes = {
	__proto__: null,
	position: float3,
	normal: float3,
	uv: float2,
	uv2: float2,
	tangent: float4,
	color: float4,
	weights: float4,
	weights1: float4,
	joints: uint4,
	joints1: uint4
};
function _attributeInfo(name) {
	return attributes[name];
}
/** @internal Canonical tight layout for one attribute. */
function _attributeLayout(name, shaderLocation) {
	const info = attributes[name];
	return _createAttributeLayout(info._format, info._stride, shaderLocation);
}
/** @internal One layout shape for both canonical and explicitly declared formats. */
function _createAttributeLayout(format, arrayStride, shaderLocation, offset = 0) {
	return {
		arrayStride,
		attributes: [{
			shaderLocation,
			offset,
			format
		}]
	};
}
export { _attributeInfo, _attributeLayout, _createAttributeLayout, _getShaderVbSupport, _installShaderVbSupport };

//# sourceMappingURL=shader-vb-support.js.map