import { F32, U32 } from "../engine/typed-arrays.js";
import { computeNormals } from "./compute-normals.js";
import { POLYHEDRA } from "./polyhedron-data.js";
// src/mesh/create-polyhedron.ts
/**
* CreatePolyhedron — matches Babylon.js MeshBuilder.CreatePolyhedron defaults.
*
* The 15 preset polyhedra are stored in `polyhedron-data.ts` (tables copied
* verbatim from BJS). Two rendering modes:
*   flat=true  (default) — each face is duplicated per-vertex with a uniform
*               UV layout; faces appear as distinct polygons.
*   flat=false — shared vertex positions, smoothed normals, empty UVs.
*
* Options omitted vs. BJS: `custom`, `faceUV`, `faceColors`, `sideOrientation`,
* `frontUVs`, `backUVs`. Defaults match exactly.
*/
function createPolyhedronData(options = {}) {
	const type = options.type !== void 0 && (options.type < 0 || options.type >= POLYHEDRA.length) ? 0 : options.type ?? 0;
	const size = options.size;
	const sizeX = options.sizeX ?? size ?? 1;
	const sizeY = options.sizeY ?? size ?? 1;
	const sizeZ = options.sizeZ ?? size ?? 1;
	const flat = options.flat ?? true;
	const data = POLYHEDRA[type];
	const nbfaces = data.face.length;
	const positions = [];
	const uvs = [];
	const indices = [];
	if (!flat) {
		for (let i = 0; i < data.vertex.length; i++) {
			const v = data.vertex[i];
			positions.push(v[0] * sizeX, v[1] * sizeY, v[2] * sizeZ);
			uvs.push(0, 0);
		}
		for (let f = 0; f < nbfaces; f++) {
			const face = data.face[f];
			for (let i = 0; i < face.length - 2; i++) indices.push(face[0], face[i + 2], face[i + 1]);
		}
	} else {
		let index = 0;
		let faceIdx = 0;
		const indexes = [];
		for (let f = 0; f < nbfaces; f++) {
			const face = data.face[f];
			const fl = face.length;
			const ang = 2 * Math.PI / fl;
			let x = .5 * Math.tan(ang / 2);
			let y = .5;
			for (let i = 0; i < fl; i++) {
				const v = data.vertex[face[i]];
				positions.push(v[0] * sizeX, v[1] * sizeY, v[2] * sizeZ);
				indexes.push(index);
				index++;
				uvs.push(.5 + x, y - .5 + .5);
				const tmp = x * Math.cos(ang) - y * Math.sin(ang);
				y = x * Math.sin(ang) + y * Math.cos(ang);
				x = tmp;
			}
			for (let i = 0; i < fl - 2; i++) indices.push(indexes[0 + faceIdx], indexes[i + 2 + faceIdx], indexes[i + 1 + faceIdx]);
			faceIdx += fl;
		}
	}
	const normals = computeNormals(positions, indices);
	return {
		positions: new F32(positions),
		normals: new F32(normals),
		uvs: new F32(uvs),
		indices: new U32(indices)
	};
}
export { createPolyhedronData };

//# sourceMappingURL=create-polyhedron.js.map