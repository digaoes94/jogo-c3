// src/post-process/mesh-blending-blue-noise.ts
var MESH_BLENDING_BLUE_NOISE_SIZE = 128;
function hashPixel(x, y, seed) {
	let value = Math.imul(x ^ seed, 73244475) ^ Math.imul(y + seed, 295559667);
	value = Math.imul(value ^ value >>> 16, 73244475);
	value = Math.imul(value ^ value >>> 16, 73244475);
	return ((value ^ value >>> 16) >>> 0) / 4294967296;
}
function fillChannel(data, channel, seed) {
	const pixelCount = 16384;
	const whiteNoise = new Float32Array(pixelCount);
	const highPassNoise = new Float32Array(pixelCount);
	const rankedIndices = new Array(pixelCount);
	for (let y = 0; y < MESH_BLENDING_BLUE_NOISE_SIZE; y++) for (let x = 0; x < MESH_BLENDING_BLUE_NOISE_SIZE; x++) {
		const index = y * MESH_BLENDING_BLUE_NOISE_SIZE + x;
		whiteNoise[index] = hashPixel(x, y, seed);
		rankedIndices[index] = index;
	}
	for (let y = 0; y < MESH_BLENDING_BLUE_NOISE_SIZE; y++) {
		const previousY = y - 1 & 127;
		const nextY = y + 1 & 127;
		for (let x = 0; x < MESH_BLENDING_BLUE_NOISE_SIZE; x++) {
			const previousX = x - 1 & 127;
			const nextX = x + 1 & 127;
			const index = y * MESH_BLENDING_BLUE_NOISE_SIZE + x;
			const neighborAverage = (whiteNoise[y * MESH_BLENDING_BLUE_NOISE_SIZE + previousX] + whiteNoise[y * MESH_BLENDING_BLUE_NOISE_SIZE + nextX] + whiteNoise[previousY * MESH_BLENDING_BLUE_NOISE_SIZE + x] + whiteNoise[nextY * MESH_BLENDING_BLUE_NOISE_SIZE + x] + whiteNoise[previousY * MESH_BLENDING_BLUE_NOISE_SIZE + previousX] + whiteNoise[previousY * MESH_BLENDING_BLUE_NOISE_SIZE + nextX] + whiteNoise[nextY * MESH_BLENDING_BLUE_NOISE_SIZE + previousX] + whiteNoise[nextY * MESH_BLENDING_BLUE_NOISE_SIZE + nextX]) * .125;
			highPassNoise[index] = whiteNoise[index] - neighborAverage;
		}
	}
	rankedIndices.sort((left, right) => highPassNoise[left] - highPassNoise[right] || left - right);
	for (let rank = 0; rank < pixelCount; rank++) data[rankedIndices[rank] * 2 + channel] = Math.floor(rank * 256 / pixelCount);
}
/** Create the deterministic, spatially stable two-channel noise used by mesh blending. */
function createMeshBlendingBlueNoiseData() {
	const data = /* @__PURE__ */ new Uint8Array(32768);
	fillChannel(data, 0, 1757159915);
	fillChannel(data, 1, 795749149);
	return data;
}
export { createMeshBlendingBlueNoiseData };

//# sourceMappingURL=mesh-blending-blue-noise.js.map