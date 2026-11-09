// src/material/parallax/parallax-occlusion.ts
/** @internal */
function _getParallaxHeightTexture(material) {
	const props = material._parallaxOcclusion;
	return props && (props.heightScale ?? .05) !== 0 ? props.heightTexture : void 0;
}
/** @internal */
function _getStandardParallaxHeightTexture(material) {
	const height = _getParallaxHeightTexture(material);
	return height && (material.diffuseTexture || material._emissiveTexture || material._bumpTexture || material._specularTexture || material._ambientTexture || material._lightmapTexture || material._opacityTexture) ? height : void 0;
}
/** @internal */
var _PARALLAX_UBO_FIELDS = [
	{
		_name: "parallaxHeight",
		_type: "vec4<f32>"
	},
	{
		_name: "parallaxSampling",
		_type: "vec4<f32>"
	},
	{
		_name: "parallaxUVm",
		_type: "vec4<f32>"
	},
	{
		_name: "parallaxUVt",
		_type: "vec4<f32>"
	}
];
function validateSteps(value, name, maximum) {
	if (!Number.isInteger(value) || value < 1 || value > maximum) throw new RangeError(`Parallax ${name} must be an integer between 1 and ${maximum}.`);
}
/** @internal Validate before changing material state or registering an extension. */
function _copyParallaxOcclusionProps(props) {
	if (!props?.heightTexture) throw new TypeError("Parallax occlusion requires a heightTexture; pass null to the setter to disable it.");
	const scale = props.heightScale ?? .05;
	if (!Number.isFinite(scale) || !Number.isFinite(Math.fround(scale)) || scale < 0) throw new RangeError("Parallax heightScale must be finite, non-negative, and representable as f32.");
	const center = props.heightCenter ?? 0;
	if (!Number.isFinite(center) || center < 0 || center > 1) throw new RangeError("Parallax heightCenter must be between 0 and 1.");
	const channel = props.heightChannel ?? "r";
	if (typeof channel !== "string" || channel.length !== 1 || !"rgba".includes(channel)) throw new RangeError("Parallax heightChannel must be \"r\", \"g\", \"b\", or \"a\".");
	const minSteps = props.minSteps ?? 8;
	const maxSteps = props.maxSteps ?? 32;
	validateSteps(minSteps, "minSteps", 64);
	validateSteps(maxSteps, "maxSteps", 64);
	validateSteps(props.refinementSteps ?? 8, "refinementSteps", 32);
	if (maxSteps < minSteps) throw new RangeError("Parallax maxSteps must be greater than or equal to minSteps.");
	const texture = props.heightTexture;
	const format = texture.texture.format;
	if (texture._sampleType === "depth" || format.startsWith("depth") || format === "stencil8" || format.endsWith("uint") || format.endsWith("sint") || format === "r32float" || format === "rg32float" || format === "rgba32float") throw new TypeError("Parallax heightTexture must use a filterable color format.");
	if (channel !== "a" && format.endsWith("-srgb")) throw new TypeError("Parallax RGB height channels require a linear texture format; sRGB textures may only use alpha.");
	for (const name of [
		"uScale",
		"vScale",
		"uOffset",
		"vOffset",
		"uAng"
	]) {
		const value = texture[name];
		if (value !== void 0 && (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))) throw new RangeError(`Parallax heightTexture.${name} must be finite and representable as f32.`);
	}
	return { ...props };
}
/** @internal Write four vec4 fields at float offsets. The base transform may alias data; no per-update allocations. */
function _writeParallaxUniforms(data, props, heightOffset, samplingOffset, matrixOffset, translationOffset, baseTransform, invertY = false) {
	const baseScaleX = baseTransform?.[0] ?? 1;
	const baseScaleY = baseTransform?.[1] ?? 1;
	const baseOffsetX = baseTransform?.[2] ?? 0;
	const baseOffsetY = baseTransform?.[3] ?? 0;
	data[heightOffset] = props.heightScale ?? .05;
	data[heightOffset + 1] = props.heightCenter ?? 0;
	data[heightOffset + 2] = 0;
	data[heightOffset + 3] = 0;
	data[samplingOffset] = props.minSteps ?? 8;
	data[samplingOffset + 1] = props.maxSteps ?? 32;
	data[samplingOffset + 2] = props.refinementSteps ?? 8;
	data[samplingOffset + 3] = "rgba".indexOf(props.heightChannel ?? "r");
	const texture = props.heightTexture;
	const c = Math.cos(texture.uAng ?? 0);
	const s = Math.sin(texture.uAng ?? 0);
	const sx = texture.uScale ?? 1;
	const sy = texture.vScale ?? 1;
	const m00 = c * sx;
	const m01 = s * sy;
	const m10 = -s * sx;
	const m11 = c * sy;
	data[matrixOffset] = m00 * baseScaleX;
	data[matrixOffset + 1] = m01 * baseScaleY;
	data[matrixOffset + 2] = m10 * baseScaleX;
	data[matrixOffset + 3] = m11 * baseScaleY;
	data[translationOffset] = m00 * baseOffsetX + m01 * baseOffsetY + (texture.uOffset ?? 0);
	data[translationOffset + 1] = m10 * baseOffsetX + m11 * baseOffsetY + (texture.vOffset ?? 0);
	data[translationOffset + 2] = 0;
	data[translationOffset + 3] = 0;
	if (invertY) {
		data[matrixOffset + 2] = -data[matrixOffset + 2];
		data[matrixOffset + 3] = -data[matrixOffset + 3];
		data[translationOffset + 1] = 1 - data[translationOffset + 1];
	}
}
export { _PARALLAX_UBO_FIELDS, _copyParallaxOcclusionProps, _getParallaxHeightTexture, _getStandardParallaxHeightTexture, _writeParallaxUniforms };

//# sourceMappingURL=parallax-occlusion.js.map