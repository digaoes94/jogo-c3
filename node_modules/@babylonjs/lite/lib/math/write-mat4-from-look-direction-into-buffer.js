// src/math/write-mat4-from-look-direction-into-buffer.ts
/**
* Write an orientation matrix that maps local +Z to `forward` and local +Y to
* `up`. Inputs must be normalized and orthogonal.
*/
function writeMat4FromLookDirectionLHIntoBuffer(out, forward, up) {
	return writeBasis(out, up.y * forward.z - up.z * forward.y, up.z * forward.x - up.x * forward.z, up.x * forward.y - up.y * forward.x, up.x, up.y, up.z, forward.x, forward.y, forward.z);
}
/**
* Write an orientation matrix that maps local -Z to `forward` and local +Y to
* `up`. Inputs must be normalized and orthogonal.
*/
function writeMat4FromLookDirectionRHIntoBuffer(out, forward, up) {
	const backX = -forward.x;
	const backY = -forward.y;
	const backZ = -forward.z;
	return writeBasis(out, up.y * backZ - up.z * backY, up.z * backX - up.x * backZ, up.x * backY - up.y * backX, up.x, up.y, up.z, backX, backY, backZ);
}
function writeBasis(out, x0, x1, x2, y0, y1, y2, z0, z1, z2) {
	out[0] = x0;
	out[1] = x1;
	out[2] = x2;
	out[3] = 0;
	out[4] = y0;
	out[5] = y1;
	out[6] = y2;
	out[7] = 0;
	out[8] = z0;
	out[9] = z1;
	out[10] = z2;
	out[11] = 0;
	out[12] = 0;
	out[13] = 0;
	out[14] = 0;
	out[15] = 1;
	return out;
}
export { writeMat4FromLookDirectionLHIntoBuffer, writeMat4FromLookDirectionRHIntoBuffer };

//# sourceMappingURL=write-mat4-from-look-direction-into-buffer.js.map