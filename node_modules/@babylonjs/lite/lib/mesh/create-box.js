import { F32, U32 } from "../engine/typed-arrays.js";
// src/mesh/create-box.ts
var BOX_POSITION_SIGNS = [
	1260470181,
	3738583663,
	128
];
var BOX_NORMALS = new F32([
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	1,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0,
	0,
	-1,
	0
]);
var BOX_UVS = new F32([
	1,
	1,
	0,
	1,
	0,
	0,
	1,
	0,
	1,
	1,
	0,
	1,
	0,
	0,
	1,
	0,
	1,
	1,
	0,
	1,
	0,
	0,
	1,
	0,
	1,
	1,
	0,
	1,
	0,
	0,
	1,
	0,
	1,
	1,
	0,
	1,
	0,
	0,
	1,
	0,
	1,
	1,
	0,
	1,
	0,
	0,
	1,
	0
]);
var BOX_INDICES = new U32([
	0,
	1,
	2,
	0,
	2,
	3,
	4,
	5,
	6,
	4,
	6,
	7,
	8,
	9,
	10,
	8,
	10,
	11,
	12,
	13,
	14,
	12,
	14,
	15,
	16,
	17,
	18,
	16,
	18,
	19,
	20,
	21,
	22,
	20,
	22,
	23
]);
/**
* Create box CPU data. A number sets a uniform size; structured options can set
* independent dimensions, with `size` as the fallback for unspecified axes.
*
* Always returns freshly-allocated typed arrays (never the shared module-level
* constants), matching the other primitive data factories (createSphereData,
* createCylinderData, …). This keeps the public API safe: callers may freely
* mutate the returned buffers without corrupting subsequent calls.
*/
function createBoxData(options = 1) {
	let dimensions;
	if (typeof options === "number") dimensions = [
		options,
		options,
		options
	];
	else {
		const { size = 1, width = size, height = size, depth = size } = options;
		dimensions = [
			width,
			height,
			depth
		];
	}
	const positions = new F32(72);
	for (let index = 0; index < positions.length; index++) {
		const sign = BOX_POSITION_SIGNS[index >> 5] >>> (index & 31) & 1;
		positions[index] = (sign - .5) * dimensions[index % 3];
	}
	return {
		positions,
		normals: BOX_NORMALS.slice(),
		uvs: BOX_UVS.slice(),
		indices: BOX_INDICES.slice(),
		vertexCount: 24,
		indexCount: 36
	};
}
export { createBoxData };

//# sourceMappingURL=create-box.js.map