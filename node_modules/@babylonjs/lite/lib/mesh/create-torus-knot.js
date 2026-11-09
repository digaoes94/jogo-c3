import { computeNormals } from "./compute-normals.js";
// src/mesh/create-torus-knot.ts
/**
* Torus-knot mesh generator — matches Babylon.js `CreateTorusKnotVertexData` exactly.
*
* The knot centre-line is the (p, q) torus knot curve:
*
*   getPos(angle):
*     cu = cos(angle), su = sin(angle), s = (q/p) * angle
*     x = radius * (2 + cos(s)) * 0.5 * cu
*     y = radius * (2 + cos(s)) * 0.5 * su
*     z = radius * sin(s) * 0.5
*
* A Frenet-like frame (tangent / normal / bitangent built from cross products of
* the curve point and a nearby sample) sweeps a circle of `tube` radius around
* the curve. Normals are computed with the area-weighted-per-face-then-normalize
* scheme of Babylon's `VertexData.ComputeNormals` (see {@link computeNormals}),
* NOT analytically, so the knot shades pixel-identically to Babylon.js.
*
* Loop bounds mirror Babylon precisely: the vertex loop runs `i <= radialSegments`
* (with `i % radialSegments` wrap) while the index loop runs `i < radialSegments`
* and `j < tubularSegments` (with `(j + 1) % tubularSegments` wrap).
*/
/**
* Builds the CPU vertex data for a torus knot, matching Babylon.js byte-for-byte
* (same curve math, same Frenet frame, same ComputeNormals, same index winding).
*
* @param opts - Optional radius / tube / segmentation / winding parameters.
* @returns Tightly-packed `positions`, `normals`, `uvs` and `indices` typed arrays.
*/
function createTorusKnotData(opts = {}) {
	const radius = opts.radius ?? 2;
	const tube = opts.tube ?? .5;
	const radialSegments = opts.radialSegments ?? 32;
	const tubularSegments = opts.tubularSegments ?? 32;
	const p = opts.p ?? 2;
	const q = opts.q ?? 3;
	const positions = [];
	const uvs = [];
	const indices = [];
	const getPos = (angle) => {
		const cu = Math.cos(angle);
		const su = Math.sin(angle);
		const quOverP = q / p * angle;
		const cs = Math.cos(quOverP);
		return [
			radius * (2 + cs) * .5 * cu,
			radius * (2 + cs) * su * .5,
			radius * Math.sin(quOverP) * .5
		];
	};
	for (let i = 0; i <= radialSegments; i++) {
		const u = i % radialSegments / radialSegments * 2 * p * Math.PI;
		const p1 = getPos(u);
		const p2 = getPos(u + .01);
		const tangX = p2[0] - p1[0];
		const tangY = p2[1] - p1[1];
		const tangZ = p2[2] - p1[2];
		let nX = p2[0] + p1[0];
		let nY = p2[1] + p1[1];
		let nZ = p2[2] + p1[2];
		let bitanX = tangY * nZ - tangZ * nY;
		let bitanY = tangZ * nX - tangX * nZ;
		let bitanZ = tangX * nY - tangY * nX;
		nX = bitanY * tangZ - bitanZ * tangY;
		nY = bitanZ * tangX - bitanX * tangZ;
		nZ = bitanX * tangY - bitanY * tangX;
		let bitanLen = Math.sqrt(bitanX * bitanX + bitanY * bitanY + bitanZ * bitanZ);
		if (bitanLen === 0) bitanLen = 1;
		bitanX /= bitanLen;
		bitanY /= bitanLen;
		bitanZ /= bitanLen;
		let nLen = Math.sqrt(nX * nX + nY * nY + nZ * nZ);
		if (nLen === 0) nLen = 1;
		nX /= nLen;
		nY /= nLen;
		nZ /= nLen;
		for (let j = 0; j < tubularSegments; j++) {
			const v = j % tubularSegments / tubularSegments * 2 * Math.PI;
			const cx = -tube * Math.cos(v);
			const cy = tube * Math.sin(v);
			positions.push(p1[0] + cx * nX + cy * bitanX);
			positions.push(p1[1] + cx * nY + cy * bitanY);
			positions.push(p1[2] + cx * nZ + cy * bitanZ);
			uvs.push(i / radialSegments);
			uvs.push(j / tubularSegments);
		}
	}
	for (let i = 0; i < radialSegments; i++) for (let j = 0; j < tubularSegments; j++) {
		const jNext = (j + 1) % tubularSegments;
		const a = i * tubularSegments + j;
		const b = (i + 1) * tubularSegments + j;
		const c = (i + 1) * tubularSegments + jNext;
		const d = i * tubularSegments + jNext;
		indices.push(d);
		indices.push(b);
		indices.push(a);
		indices.push(d);
		indices.push(c);
		indices.push(b);
	}
	const normals = computeNormals(positions, indices);
	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		uvs: new Float32Array(uvs),
		indices: new Uint32Array(indices)
	};
}
export { createTorusKnotData };

//# sourceMappingURL=create-torus-knot.js.map