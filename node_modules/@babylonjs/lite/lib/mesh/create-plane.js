import { F32, U32 } from "../engine/typed-arrays.js";
// src/mesh/create-plane.ts
function createPlaneData(options = {}) {
	const size = options.size ?? 1;
	const width = options.width ?? size;
	const height = options.height ?? size;
	const hw = width / 2;
	const hh = height / 2;
	return {
		positions: new F32([
			-hw,
			-hh,
			0,
			hw,
			-hh,
			0,
			hw,
			hh,
			0,
			-hw,
			hh,
			0
		]),
		normals: new F32([
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
			-1
		]),
		uvs: new F32([
			0,
			0,
			1,
			0,
			1,
			1,
			0,
			1
		]),
		indices: new U32([
			0,
			1,
			2,
			0,
			2,
			3
		])
	};
}
export { createPlaneData };

//# sourceMappingURL=create-plane.js.map