// src/mesh-lod/mesh-lod-selection-math.ts
/** MeshLoD selection math — the shared float32 primitives used by the CPU oracle,
*  the GPU selection model, and (mirrored line-for-line) the selection WGSL.
*
*  Every comparison-sensitive value is rounded through `Math.fround` so the three
*  selectors make bit-identical decisions (architecture §10.1). Keeping this math in
*  one module is what lets the GPU path be accepted only after deterministic
*  equivalence with the CPU oracle. The world matrix is column-major (WebGPU/WGSL
*  order): columns 0-2 are the basis and column 3 (`m[12..14]`) is the translation. */
var f32 = Math.fround;
var fadd = (a, b) => f32(a + b);
var fsub = (a, b) => f32(a - b);
var fmul = (a, b) => f32(a * b);
var fdiv = (a, b) => f32(a / b);
var fsqrt = (a) => f32(Math.sqrt(a));
/** Float32 page benefit, matching the production compute kernel's operation order. */
function meshLoDPageBenefit(p, screenSpaceError, targetWidth, targetHeight, missingPages) {
	return fdiv(fmul(Math.min(fmul(fmul(f32(Math.PI), p.projectedRadiusPx), p.projectedRadiusPx), fmul(targetWidth, targetHeight)), Math.max(0, fsub(fdiv(p.errorPx, screenSpaceError), 1))), missingPages);
}
/** Saturating float32 sum mirrored by the GPU's compare/exchange accumulator. */
function addMeshLoDPageBenefit(current, benefit) {
	const maximum = 34028234663852886e22;
	return benefit < fsub(maximum, current) ? fadd(current, benefit) : maximum;
}
/** Conservative operator-norm bound: sqrt(||A^T A||_infinity), including shear. */
function conservativeWorldScale(m) {
	const c0 = m[0] * m[0] + m[1] * m[1] + m[2] * m[2];
	const c1 = m[4] * m[4] + m[5] * m[5] + m[6] * m[6];
	const c2 = m[8] * m[8] + m[9] * m[9] + m[10] * m[10];
	const d01 = Math.abs(m[0] * m[4] + m[1] * m[5] + m[2] * m[6]);
	const d02 = Math.abs(m[0] * m[8] + m[1] * m[9] + m[2] * m[10]);
	const d12 = Math.abs(m[4] * m[8] + m[5] * m[9] + m[6] * m[10]);
	const bound = Math.sqrt(Math.max(c0 + d01 + d02, c1 + d01 + d12, c2 + d02 + d12));
	const scale = f32(bound);
	return scale < bound ? f32(scale + Math.max(scale * 2 ** -23, 2 ** -149)) : scale;
}
/** Whether the upper-left 3x3 is a non-degenerate similarity transform. Normal
*  cones remain conservative under rotation/reflection and uniform scale; they
*  are disabled for shear or non-uniform scale. */
function isSimilarityTransform(m) {
	const lengths = [
		Math.hypot(m[0], m[1], m[2]),
		Math.hypot(m[4], m[5], m[6]),
		Math.hypot(m[8], m[9], m[10])
	];
	const scale = Math.max(...lengths);
	if (!(scale > 1e-8)) return false;
	const tolerance = scale * 1e-4;
	if (Math.max(...lengths) - Math.min(...lengths) > tolerance) return false;
	const dotTolerance = scale * scale * 1e-4;
	const dot01 = m[0] * m[4] + m[1] * m[5] + m[2] * m[6];
	const dot02 = m[0] * m[8] + m[1] * m[9] + m[2] * m[10];
	const dot12 = m[4] * m[8] + m[5] * m[9] + m[6] * m[10];
	return Math.abs(dot01) <= dotTolerance && Math.abs(dot02) <= dotTolerance && Math.abs(dot12) <= dotTolerance;
}
/** Conservative perspective normal-cone margin. Positive values are visible;
*  zero or negative values satisfy meshoptimizer's backface rejection test. */
function meshLoDConeCullMargin(m, cameraPos, center, radius, normalCone) {
	if (!normalCone || !isSimilarityTransform(m)) return Number.POSITIVE_INFINITY;
	const worldScale = conservativeWorldScale(m);
	const wx = fadd(fadd(fmul(m[0], center[0]), fmul(m[4], center[1])), fadd(fmul(m[8], center[2]), m[12]));
	const wy = fadd(fadd(fmul(m[1], center[0]), fmul(m[5], center[1])), fadd(fmul(m[9], center[2]), m[13]));
	const wz = fadd(fadd(fmul(m[2], center[0]), fmul(m[6], center[1])), fadd(fmul(m[10], center[2]), m[14]));
	const n0x = fsub(fmul(m[5], m[10]), fmul(m[6], m[9]));
	const n0y = fsub(fmul(m[6], m[8]), fmul(m[4], m[10]));
	const n0z = fsub(fmul(m[4], m[9]), fmul(m[5], m[8]));
	const n1x = fsub(fmul(m[9], m[2]), fmul(m[10], m[1]));
	const n1y = fsub(fmul(m[10], m[0]), fmul(m[8], m[2]));
	const n1z = fsub(fmul(m[8], m[1]), fmul(m[9], m[0]));
	const n2x = fsub(fmul(m[1], m[6]), fmul(m[2], m[5]));
	const n2y = fsub(fmul(m[2], m[4]), fmul(m[0], m[6]));
	const n2z = fsub(fmul(m[0], m[5]), fmul(m[1], m[4]));
	const sign = fadd(fadd(fmul(m[0], n0x), fmul(m[1], n0y)), fmul(m[2], n0z)) < 0 ? -1 : 1;
	let ax = fmul(sign, fadd(fadd(fmul(n0x, normalCone[0]), fmul(n1x, normalCone[1])), fmul(n2x, normalCone[2])));
	let ay = fmul(sign, fadd(fadd(fmul(n0y, normalCone[0]), fmul(n1y, normalCone[1])), fmul(n2y, normalCone[2])));
	let az = fmul(sign, fadd(fadd(fmul(n0z, normalCone[0]), fmul(n1z, normalCone[1])), fmul(n2z, normalCone[2])));
	const axisLength = fsqrt(fadd(fadd(fmul(ax, ax), fmul(ay, ay)), fmul(az, az)));
	if (!(axisLength > 1e-8)) return Number.POSITIVE_INFINITY;
	ax = fdiv(ax, axisLength);
	ay = fdiv(ay, axisLength);
	az = fdiv(az, axisLength);
	const vx = fsub(wx, cameraPos[0]);
	const vy = fsub(wy, cameraPos[1]);
	const vz = fsub(wz, cameraPos[2]);
	const distance = fsqrt(fadd(fadd(fmul(vx, vx), fmul(vy, vy)), fmul(vz, vz)));
	const dot = fadd(fadd(fmul(vx, ax), fmul(vy, ay)), fmul(vz, az));
	return fdiv(fsub(fadd(fmul(normalCone[3], distance), fmul(radius, worldScale)), dot), Math.max(distance, 1e-20));
}
/** Perspective pixel scale `targetHeight / (2 * tan(verticalFov / 2))`. */
function perspectivePixelScale(targetHeight, verticalFov) {
	return fdiv(targetHeight, fmul(2, f32(Math.tan(f32(verticalFov / 2)))));
}
/** Project a primitive-local sphere (center/radius/error) through a column-major
*  world matrix and camera, returning the screen-space error and radius in pixels.
*  `orthographicHeight > 0` selects the orthographic screen-space-error equation. */
function projectSphere(m, cameraPos, cameraNear, orthographicHeight, targetHeight, worldScale, pixelScale, center, radius, error) {
	const wx = fadd(fadd(fmul(m[0], center[0]), fmul(m[4], center[1])), fadd(fmul(m[8], center[2]), m[12]));
	const wy = fadd(fadd(fmul(m[1], center[0]), fmul(m[5], center[1])), fadd(fmul(m[9], center[2]), m[13]));
	const wz = fadd(fadd(fmul(m[2], center[0]), fmul(m[6], center[1])), fadd(fmul(m[10], center[2]), m[14]));
	const worldRadius = fmul(radius, worldScale);
	const worldError = fmul(error, worldScale);
	const dx = fsub(cameraPos[0], wx);
	const dy = fsub(cameraPos[1], wy);
	const dz = fsub(cameraPos[2], wz);
	const distance = fsqrt(fadd(fadd(fmul(dx, dx), fmul(dy, dy)), fmul(dz, dz)));
	const surfaceDistance = Math.max(fsub(distance, worldRadius), cameraNear);
	const ortho = orthographicHeight !== void 0 && orthographicHeight > 0;
	let errorPx;
	let projectedRadiusPx;
	if (ortho) {
		const scale = fdiv(targetHeight, orthographicHeight);
		errorPx = fmul(worldError, scale);
		projectedRadiusPx = fmul(worldRadius, scale);
	} else {
		errorPx = fdiv(fmul(worldError, pixelScale), surfaceDistance);
		projectedRadiusPx = fdiv(fmul(worldRadius, pixelScale), surfaceDistance);
	}
	return {
		worldCenter: [
			wx,
			wy,
			wz
		],
		worldRadius,
		errorPx,
		projectedRadiusPx
	};
}
/** True when a world-space sphere is strictly outside any normalized frustum plane.
*  An empty plane list is never outside (culling disabled). */
function sphereOutsidePlanes(planes, center, radius) {
	for (const [nx, ny, nz, d] of planes) if (fadd(fadd(fmul(nx, center[0]), fmul(ny, center[1])), fadd(fmul(nz, center[2]), d)) < f32(-radius)) return true;
	return false;
}
/** Extract the six normalized frustum planes `[nx, ny, nz, d]` (inside = `n·p+d>=0`)
*  from a column-major view-projection matrix. Left, right, bottom, top, near, far —
*  the same order and normalization the selection WGSL uses. */
function extractFrustumPlanes(m) {
	const plane = (x, y, z, w) => {
		const invLen = 1 / Math.hypot(x, y, z);
		return [
			x * invLen,
			y * invLen,
			z * invLen,
			w * invLen
		];
	};
	return [
		plane(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]),
		plane(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]),
		plane(m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]),
		plane(m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]),
		plane(m[2], m[6], m[10], m[14]),
		plane(m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14])
	];
}
export { addMeshLoDPageBenefit, conservativeWorldScale, extractFrustumPlanes, f32, fadd, fdiv, fmul, fsqrt, fsub, isSimilarityTransform, meshLoDConeCullMargin, meshLoDPageBenefit, perspectivePixelScale, projectSphere, sphereOutsidePlanes };

//# sourceMappingURL=mesh-lod-selection-math.js.map