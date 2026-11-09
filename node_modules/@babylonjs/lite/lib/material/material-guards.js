import { getMaterialFamily } from "./material-family.js";
// src/material/material-guards.ts
/** TypeScript type guard: narrows a {@link Material} to {@link PbrMaterialProps} when it
*  belongs to the PBR family (see {@link getMaterialFamily}). A {@link MaterialView} over a
*  PBR source also passes, since it inherits every PBR property through its prototype chain. */
function isPbrMaterial(material) {
	return getMaterialFamily(material) === "pbr";
}
/** TypeScript type guard: narrows a {@link Material} to {@link StandardMaterialProps} when it
*  belongs to the standard family (see {@link getMaterialFamily}). A {@link MaterialView} over a
*  standard source also passes, since it inherits every standard property through its prototype
*  chain. */
function isStandardMaterial(material) {
	return getMaterialFamily(material) === "standard";
}
/** TypeScript type guard: narrows a {@link Material} to {@link ShaderMaterial} when it belongs to
*  the shader family (see {@link getMaterialFamily}). This also covers materials built on top of
*  {@link createShaderMaterial}, such as the grid material. A {@link MaterialView} over a shader
*  source also passes, since it inherits every shader property through its prototype chain. */
function isShaderMaterial(material) {
	return getMaterialFamily(material) === "shader";
}
/** TypeScript type guard: narrows a {@link Material} to {@link NodeMaterial} when it belongs to
*  the node family (see {@link getMaterialFamily}). A {@link MaterialView} over a node source also
*  passes, since it inherits every node property through its prototype chain. */
function isNodeMaterial(material) {
	return getMaterialFamily(material) === "node";
}
export { isNodeMaterial, isPbrMaterial, isShaderMaterial, isStandardMaterial };

//# sourceMappingURL=material-guards.js.map