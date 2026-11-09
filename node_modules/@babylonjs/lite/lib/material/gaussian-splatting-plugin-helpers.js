// src/material/gaussian-splatting-plugin-helpers.ts
var GAUSSIAN_SPLATTING_MAX_PART_COUNT = 128;
function getGaussianSplattingPartIndexVaryingDeclaration(wgsl) {
	return `
#if !defined(VPARTINDEX_VARYING_DECLARED)
#define VPARTINDEX_VARYING_DECLARED
${wgsl ? "varying vPartIndex: f32;" : "varying float vPartIndex;"}
#endif
`;
}
export { GAUSSIAN_SPLATTING_MAX_PART_COUNT, getGaussianSplattingPartIndexVaryingDeclaration };

//# sourceMappingURL=gaussian-splatting-plugin-helpers.js.map