import { F32 } from "../engine/typed-arrays.js";
// src/math/spherical-harmonics.ts
/**
* Shared SH → SphericalPolynomial conversion.
*
* Converts 9-band (L0–L2) spherical harmonic coefficients in channel-major
* layout into the 27-float polynomial form used by the BJS
* SphericalPolynomial.FromHarmonics convention.
*
* Input layout (Float64Array, 27 entries):
*   sh[ch * 9 + band]  where ch ∈ `{0=R, 1=G, 2=B}`, band ∈ 0..8
*   Band order: L00, L1_-1, L10, L11, L2_-2, L2_-1, L20, L21, L22
*   Standard (positive) SH basis — no Condon-Shortley negation.
*
* Output layout (Float32Array, 27 entries):
*   poly[field * 3 + ch]  where field ∈ `{x,y,z,xx,yy,zz,yz,zx,xy}`
*/
function shToPolynomial(sh) {
	const invPI = 1 / Math.PI;
	const poly = new F32(27);
	for (let ch = 0; ch < 3; ch++) {
		const o = ch * 9;
		const L00 = sh[o], L1_1 = sh[o + 1], L10 = sh[o + 2], L11 = sh[o + 3];
		const L2_2 = sh[o + 4], L2_1 = sh[o + 5], L20 = sh[o + 6], L21 = sh[o + 7], L22 = sh[o + 8];
		poly[0 + ch] = L11 * 1.02333 * invPI;
		poly[3 + ch] = L1_1 * 1.02333 * invPI;
		poly[6 + ch] = L10 * 1.02333 * invPI;
		poly[9 + ch] = (L00 * .886227 - L20 * .247708 + L22 * .429043) * invPI;
		poly[12 + ch] = (L00 * .886227 - L20 * .247708 - L22 * .429043) * invPI;
		poly[15 + ch] = (L00 * .886227 + L20 * .495417) * invPI;
		poly[18 + ch] = L2_1 * .858086 * invPI;
		poly[21 + ch] = L21 * .858086 * invPI;
		poly[24 + ch] = L2_2 * .858086 * invPI;
	}
	return poly;
}
export { shToPolynomial };

//# sourceMappingURL=spherical-harmonics.js.map