// src/shader/fragments/shadow-fragment-pcf.ts
function offsetVector(name, component) {
	return `let ${name} =vec3<f32>((3.0-2.0*st.${component})/uvw0.${component} -2.0,(3.0+st.${component})/uvw1.${component},st.${component} /uvw2.${component} +2.0)*invMapSz;`;
}
var shadowAlgorithm = {
	shadowTexture: {
		_kind: "texture",
		_textureType: "texture_depth_2d",
		_sampleType: "depth"
	},
	shadowSamplerName: "shadowComp",
	shadowSampler: {
		_kind: "sampler",
		_samplerType: "sampler_comparison"
	},
	shadowFragmentLine(lightIndex, suffix, factors = "shadowFactors") {
		const info = `shadowInfo${suffix}.shadowsInfo`;
		return `${factors}[${lightIndex}]=computeShadowPCF${suffix}(input.vPosFromLight${suffix},input.vDepthMetric${suffix},${info}.x,${info}.y,${info}.z);`;
	},
	shadowHelper(suffix, projection) {
		const taps = [];
		for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) taps.push(`sh+=uvw${column}.x*uvw${row}.y*textureSampleCompareLevel(shadowTex${suffix},shadowComp${suffix},base+vec2<f32>(u[${column}],v[${row}]),depthRef);`);
		return `fn computeShadowPCF${suffix}(posFromLight:vec4<f32>,depthMetric:f32,darkness:f32,mapSz:f32,invMapSz:f32)->f32{${projection} let depthRef=clamp(clipSpace.z,0.0,1.0);var tc=uv*mapSz+0.5;let st=fract(tc);let base=(floor(tc)-0.5)*invMapSz;let uvw0=4.0-3.0*st;let uvw1=vec2<f32>(7.0);let uvw2=1.0+3.0*st;${offsetVector("u", "x")} ${offsetVector("v", "y")} var sh=0.0;${taps.join("\n")} sh/=144.0;return mix(darkness,1.0,sh);}`;
	}
};
export { shadowAlgorithm };

//# sourceMappingURL=shadow-fragment-pcf.js.map