// src/math/write-vec3.ts
/** Write Vec3 into a Float32Array at the given byte offset (for uniform buffers). */
function writeVec3(out, offset, v) {
	out[offset] = v.x;
	out[offset + 1] = v.y;
	out[offset + 2] = v.z;
}
export { writeVec3 };

//# sourceMappingURL=write-vec3.js.map