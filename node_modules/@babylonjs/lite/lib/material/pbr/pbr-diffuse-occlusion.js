// src/material/pbr/pbr-diffuse-occlusion.ts
/** @internal An unused modifier stays null and folds into the original IBL expression. */
var pbrDiffuseOcclusion = null;
/** @internal Kept outside the lazy fragment's namespace exports so unused enablers disappear. */
function installPbrDiffuseOcclusion(modifier) {
	pbrDiffuseOcclusion = modifier;
}
export { installPbrDiffuseOcclusion, pbrDiffuseOcclusion };

//# sourceMappingURL=pbr-diffuse-occlusion.js.map