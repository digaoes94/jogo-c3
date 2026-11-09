// src/resource/buffer-alignment.ts
/** Round `n` up to the nearest multiple of `to` (must be a positive integer). */
function align(n, to) {
	return Math.ceil(n / to) * to;
}
export { align };

//# sourceMappingURL=buffer-alignment.js.map