import { observableColor3, trackScalar, trackSubProps } from "./tracking-primitives.js";
// src/material/tracking/pbr-tracking.ts
function installPbrTracking(mat) {
	for (const key of [
		"alpha",
		"environmentIntensity",
		"directIntensity",
		"reflectance",
		"occlusionStrength",
		"_metallicF0Factor"
	]) if (mat[key] !== void 0) trackScalar(mat, key);
	if (mat._emissiveColor) mat._emissiveColor = observableColor3(mat._emissiveColor[0], mat._emissiveColor[1], mat._emissiveColor[2], mat);
	if (mat._metallicReflectanceColor) mat._metallicReflectanceColor = observableColor3(mat._metallicReflectanceColor[0], mat._metallicReflectanceColor[1], mat._metallicReflectanceColor[2], mat);
	if (mat._anisotropy) trackSubProps(mat, mat._anisotropy, ["intensity"]);
	if (mat._clearCoat) trackSubProps(mat, mat._clearCoat, [
		"intensity",
		"roughness",
		"indexOfRefraction"
	]);
	if (mat._sheen) {
		const sh = mat._sheen;
		trackSubProps(mat, sh, ["intensity", "roughness"]);
		if (sh.color) sh.color = observableColor3(sh.color[0], sh.color[1], sh.color[2], mat);
	}
}
export { installPbrTracking };

//# sourceMappingURL=pbr-tracking.js.map