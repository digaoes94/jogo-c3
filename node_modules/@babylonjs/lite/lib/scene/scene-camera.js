import { createArcRotateCamera } from "../camera/arc-rotate.js";
import { vec3 } from "../math/vec3-ctor.js";
import { emptyWorldAabb, expandWorldAabbForMesh } from "../mesh/mesh-world-bounds.js";
// src/scene/scene-camera.ts
/** Create an ArcRotateCamera framed to fit all loaded meshes, assign it to scene.
*  Only the scene knows its contents — auto-framing logic lives here.
*  Matches Babylon.js createDefaultCameraOrLight(true, true, true). */
function createDefaultCamera(scene) {
	let minX = Infinity, minY = Infinity, minZ = Infinity;
	let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
	const acc = emptyWorldAabb();
	for (const m of scene.meshes) {
		if (m.visible === false) continue;
		expandWorldAabbForMesh(acc, m);
	}
	minX = acc.minX;
	minY = acc.minY;
	minZ = acc.minZ;
	maxX = acc.maxX;
	maxY = acc.maxY;
	maxZ = acc.maxZ;
	const sx = maxX - minX, sy = maxY - minY, sz = maxZ - minZ;
	let radius = Math.sqrt(sx * sx + sy * sy + sz * sz) * 1.5;
	let center = vec3(minX + sx * .5, minY + sy * .5, minZ + sz * .5);
	if (!isFinite(radius) || radius === 0) {
		radius = 1;
		center = vec3(0, 0, 0);
	}
	const cam = createArcRotateCamera(-(Math.PI / 2), Math.PI / 2, radius, center);
	cam.nearPlane = radius * .01;
	cam.farPlane = radius * 1e3;
	scene.camera = cam;
	return cam;
}
export { createDefaultCamera };

//# sourceMappingURL=scene-camera.js.map