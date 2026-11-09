// src/math/mat4-transform.ts
/**
* Transform the point `(x, y, z)` by the column-major 4x4 matrix `m` (including the perspective divide),
* writing the world-space result into `out`. Mirrors Babylon.js `Vector3.TransformCoordinatesFromFloatsToRef`.
*/
function transformCoordinatesToRef(x, y, z, m, out) {
	const s = m;
	const rx = x * s[0] + y * s[4] + z * s[8] + s[12];
	const ry = x * s[1] + y * s[5] + z * s[9] + s[13];
	const rz = x * s[2] + y * s[6] + z * s[10] + s[14];
	const rw = 1 / (x * s[3] + y * s[7] + z * s[11] + s[15]);
	out.x = rx * rw;
	out.y = ry * rw;
	out.z = rz * rw;
}
/**
* Transform the direction `(x, y, z)` by the upper 3x3 (rotation/scale, no translation) of the
* column-major matrix `m`, writing the result into `out`. Mirrors Babylon.js
* `Vector3.TransformNormalFromFloatsToRef`.
*/
function transformNormalToRef(x, y, z, m, out) {
	const s = m;
	out.x = x * s[0] + y * s[4] + z * s[8];
	out.y = x * s[1] + y * s[5] + z * s[9];
	out.z = x * s[2] + y * s[6] + z * s[10];
}
/** Read the translation component (column 3) of the column-major matrix `m` into `out`. */
function mat4GetTranslationToRef(m, out) {
	const s = m;
	out.x = s[12];
	out.y = s[13];
	out.z = s[14];
}
export { mat4GetTranslationToRef, transformCoordinatesToRef, transformNormalToRef };

//# sourceMappingURL=mat4-transform.js.map