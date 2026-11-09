// src/math/write-perspective-mat4-lh-into-buffer.ts
/** Write a reverse-Z perspective projection into `out` without allocating.
/** Write a reverse-Z perspective projection into `out` without allocating.
*  WebGPU clip-space depth is [0, 1]; this maps `near -> 1` and `far -> 0`.
*  Storage may be F32- or F64-backed. */
function writePerspectiveMat4LHIntoBuffer(out, fov, aspect, near, far) {
	const tan = 1 / Math.tan(fov * .5);
	const range = far - near;
	out[0] = tan / aspect;
	out[5] = tan;
	out[10] = -near / range;
	out[11] = 1;
	out[14] = far * near / range;
}
export { writePerspectiveMat4LHIntoBuffer };

//# sourceMappingURL=write-perspective-mat4-lh-into-buffer.js.map