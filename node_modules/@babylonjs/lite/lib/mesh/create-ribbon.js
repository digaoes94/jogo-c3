import { F32, U32 } from "../engine/typed-arrays.js";
import { computeNormals } from "./compute-normals.js";
// src/mesh/create-ribbon.ts
/**
* CreateRibbon — matches Babylon.js MeshBuilder.CreateRibbon defaults.
*
* A ribbon joins a set of parallel paths (arrays of Vec3) into a strip of
* triangles. Used directly and also as the primitive underlying `createTube`
* and `createExtrudeShape`.
*
* Options omitted vs. BJS: `sideOrientation`, `frontUVs/backUVs`, `invertUV`,
* `uvs`, `colors`, `instance`. Index ordering, UV normalization by cumulative
* distance, and `closePath`/`closeArray` normal averaging are ported verbatim
* from `@babylonjs/core/Meshes/Builders/ribbonBuilder.js`.
*/
function len(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function sub(a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
		z: a.z - b.z
	};
}
function createRibbonData(options) {
	let pathArray = options.pathArray;
	const closeArray = options.closeArray || false;
	const closePath = options.closePath || false;
	const defaultOffset = Math.floor(pathArray[0].length / 2);
	let offset = options.offset ?? defaultOffset;
	offset = offset > defaultOffset ? defaultOffset : Math.floor(offset);
	if (pathArray.length < 2) {
		const ar1 = [];
		const ar2 = [];
		const src = pathArray[0];
		for (let i = 0; i < src.length - offset; i++) {
			ar1.push(src[i]);
			ar2.push(src[i + offset]);
		}
		pathArray = [ar1, ar2];
	}
	const positions = [];
	const indices = [];
	const uvs = [];
	const us = [];
	const vs = [];
	const uTotalDistance = [];
	const vTotalDistance = [];
	const lg = [];
	const idx = [];
	const closePathCorr = closePath ? 1 : 0;
	const closeArrayCorr = closeArray ? 1 : 0;
	let minlg = pathArray[0].length;
	let idc = 0;
	for (let p = 0; p < pathArray.length + closeArrayCorr; p++) {
		uTotalDistance[p] = 0;
		us[p] = [0];
		const path = p === pathArray.length ? pathArray[0] : pathArray[p];
		const l = path.length;
		minlg = minlg < l ? minlg : l;
		let j = 0;
		while (j < l) {
			const pt = path[j];
			positions.push(pt.x, pt.y, pt.z);
			if (j > 0) {
				const dist = len(sub(path[j], path[j - 1])) + uTotalDistance[p];
				us[p].push(dist);
				uTotalDistance[p] = dist;
			}
			j++;
		}
		if (closePath) {
			j--;
			positions.push(path[0].x, path[0].y, path[0].z);
			const dist = len(sub(path[j], path[0])) + uTotalDistance[p];
			us[p].push(dist);
			uTotalDistance[p] = dist;
		}
		lg[p] = l + closePathCorr;
		idx[p] = idc;
		idc += l + closePathCorr;
	}
	for (let i = 0; i < minlg + closePathCorr; i++) {
		vTotalDistance[i] = 0;
		vs[i] = [0];
		for (let p = 0; p < pathArray.length - 1 + closeArrayCorr; p++) {
			const path1 = pathArray[p];
			const path2 = p === pathArray.length - 1 ? pathArray[0] : pathArray[p + 1];
			let v1;
			let v2;
			if (i === minlg) {
				v1 = path1[0];
				v2 = path2[0];
			} else {
				v1 = path1[i];
				v2 = path2[i];
			}
			const dist = len(sub(v2, v1)) + vTotalDistance[i];
			vs[i].push(dist);
			vTotalDistance[i] = dist;
		}
	}
	for (let p = 0; p < pathArray.length + closeArrayCorr; p++) for (let i = 0; i < minlg + closePathCorr; i++) {
		const u = uTotalDistance[p] !== 0 ? us[p][i] / uTotalDistance[p] : 0;
		const v = vTotalDistance[i] !== 0 ? vs[i][p] / vTotalDistance[i] : 0;
		uvs.push(u, v);
	}
	let p = 0;
	let pi = 0;
	let l1 = lg[p] - 1;
	let l2 = lg[p + 1] - 1;
	let min = l1 < l2 ? l1 : l2;
	let shft = idx[1] - idx[0];
	const path1nb = lg.length - 1;
	while (pi <= min && p < path1nb) {
		indices.push(pi, pi + shft, pi + 1);
		indices.push(pi + shft + 1, pi + 1, pi + shft);
		pi += 1;
		if (pi === min) {
			p++;
			shft = idx[p + 1] - idx[p];
			l1 = lg[p] - 1;
			l2 = lg[p + 1] - 1;
			pi = idx[p];
			min = l1 < l2 ? l1 + pi : l2 + pi;
		}
	}
	const normals = computeNormals(positions, indices);
	if (closePath) for (let p = 0; p < pathArray.length; p++) {
		const indexFirst = idx[p] * 3;
		const indexLast = p + 1 < pathArray.length ? (idx[p + 1] - 1) * 3 : normals.length - 3;
		normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * .5;
		normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * .5;
		normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * .5;
		const nl = Math.sqrt(normals[indexFirst] * normals[indexFirst] + normals[indexFirst + 1] * normals[indexFirst + 1] + normals[indexFirst + 2] * normals[indexFirst + 2]) || 1;
		normals[indexFirst] = normals[indexFirst] / nl;
		normals[indexFirst + 1] = normals[indexFirst + 1] / nl;
		normals[indexFirst + 2] = normals[indexFirst + 2] / nl;
		normals[indexLast] = normals[indexFirst];
		normals[indexLast + 1] = normals[indexFirst + 1];
		normals[indexLast + 2] = normals[indexFirst + 2];
	}
	if (closeArray) {
		let indexFirst = idx[0] * 3;
		let indexLast = idx[pathArray.length] * 3;
		for (let i = 0; i < minlg + closePathCorr; i++) {
			normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * .5;
			normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * .5;
			normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * .5;
			const nl = Math.sqrt(normals[indexFirst] * normals[indexFirst] + normals[indexFirst + 1] * normals[indexFirst + 1] + normals[indexFirst + 2] * normals[indexFirst + 2]) || 1;
			normals[indexFirst] = normals[indexFirst] / nl;
			normals[indexFirst + 1] = normals[indexFirst + 1] / nl;
			normals[indexFirst + 2] = normals[indexFirst + 2] / nl;
			normals[indexLast] = normals[indexFirst];
			normals[indexLast + 1] = normals[indexFirst + 1];
			normals[indexLast + 2] = normals[indexFirst + 2];
			indexFirst += 3;
			indexLast += 3;
		}
	}
	return {
		positions: new F32(positions),
		normals: new F32(normals),
		uvs: new F32(uvs),
		indices: new U32(indices)
	};
}
export { createRibbonData };

//# sourceMappingURL=create-ribbon.js.map