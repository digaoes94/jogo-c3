// src/material/standard/fragments/std-vertex-color-fragment.ts
function createStdVertexColorFragment(hasDiffuse = false, hasVertexAlpha = false) {
	let at = `baseColor*=input.vColor.rgb;`;
	if (hasVertexAlpha) at = `${at} alpha*=input.vColor.a;if(${hasDiffuse ? "_ds.a * input.vColor.a" : "input.vColor.a"} <mat.aCut){discard;}`;
	return {
		_id: "std-vertex-color",
		_vertexAttributes: [{
			_name: "color",
			_type: "vec4<f32>",
			_gpuFormat: "float32x4",
			_arrayStride: 16
		}],
		_varyings: [{
			_name: "vColor",
			_type: "vec4<f32>"
		}],
		_vertexSlots: { VB: `out.vColor=color;` },
		_fragmentSlots: { AT: at }
	};
}
export { createStdVertexColorFragment };

//# sourceMappingURL=std-vertex-color-fragment.js.map