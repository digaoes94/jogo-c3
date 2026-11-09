import { createRibbonData } from "./create-ribbon.js";
import { computePath3D } from "./path3d.js";
// src/mesh/create-tube.ts
/** Cap mode: no caps on either end of the tube/extrusion. */
var CAP_NONE = 0;
/** Cap mode: close only the start of the tube/extrusion. */
var CAP_START = 1;
/** Cap mode: close only the end of the tube/extrusion. */
var CAP_END = 2;
/** Cap mode: close both ends of the tube/extrusion. */
var CAP_ALL = 3;
function rodrigues(v, k, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	const dot = k.x * v.x + k.y * v.y + k.z * v.z;
	const crossX = k.y * v.z - k.z * v.y;
	const crossY = k.z * v.x - k.x * v.z;
	const crossZ = k.x * v.y - k.y * v.x;
	return {
		x: v.x * c + crossX * s + k.x * dot * (1 - c),
		y: v.y * c + crossY * s + k.y * dot * (1 - c),
		z: v.z * c + crossZ * s + k.z * dot * (1 - c)
	};
}
function createTubeData(options) {
	const path = options.path;
	const radius = options.radius ?? 1;
	const tessellation = (options.tessellation ?? 64) | 0;
	const radiusFunction = options.radiusFunction ?? null;
	let cap = options.cap ?? 0;
	cap = cap < 0 || cap > 3 ? 0 : cap;
	const arc = options.arc && (options.arc <= 0 || options.arc > 1) ? 1 : options.arc ?? 1;
	const { tangents, normals, distances } = computePath3D(path);
	const step = Math.PI * 2 / tessellation * arc;
	const circlePaths = [];
	let index = cap === 0 || cap === 2 ? 0 : 2;
	for (let i = 0; i < path.length; i++) {
		const rad = radiusFunction ? radiusFunction(i, distances[i]) : radius;
		const circle = [];
		const normal = normals[i];
		const tangent = tangents[i];
		for (let t = 0; t < tessellation; t++) {
			const rotated = rodrigues(normal, tangent, step * t);
			circle.push({
				x: rotated.x * rad + path[i].x,
				y: rotated.y * rad + path[i].y,
				z: rotated.z * rad + path[i].z
			});
		}
		circlePaths[index] = circle;
		index++;
	}
	const capPath = (nbPoints, pathIndex) => {
		const pts = [];
		for (let i = 0; i < nbPoints; i++) pts.push(path[pathIndex]);
		return pts;
	};
	if (cap === 1 || cap === 3) {
		circlePaths[0] = capPath(tessellation, 0);
		circlePaths[1] = circlePaths[2].slice(0);
	}
	if (cap === 2 || cap === 3) {
		circlePaths[index] = circlePaths[index - 1].slice(0);
		circlePaths[index + 1] = capPath(tessellation, path.length - 1);
	}
	return createRibbonData({
		pathArray: circlePaths,
		closePath: true,
		closeArray: false
	});
}
export { CAP_ALL, CAP_END, CAP_NONE, CAP_START, createTubeData };

//# sourceMappingURL=create-tube.js.map