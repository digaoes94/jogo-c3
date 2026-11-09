import { emptyWorldAabb, expandWorldAabbForMesh } from "../../mesh/mesh-world-bounds.js";
// src/material/pbr/scene-size.ts
/** Compute ground size and skybox size from scene bounds.
*  Matches BJS EnvironmentHelper._setupSizes() with sizeAuto=true.
*  @param userSkyboxSize - Optional user-provided skyboxSize (BJS still applies
*                         diagonal override + ×1.5 even for explicit values). */
function computeSceneSize(scene, userSkyboxSize) {
	const acc = emptyWorldAabb();
	for (const m of scene.meshes) expandWorldAabbForMesh(acc, m);
	const minX = acc.minX, minY = acc.minY, minZ = acc.minZ;
	const maxX = acc.maxX, maxY = acc.maxY, maxZ = acc.maxZ;
	if (!isFinite(minX)) return {
		groundSize: 15,
		skyboxSize: userSkyboxSize ?? 20,
		rootPosition: [
			0,
			0,
			0
		]
	};
	const dx = maxX - minX, dy = maxY - minY, dz = maxZ - minZ;
	const sceneDiagonalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
	let groundSize = 15;
	let skyboxSize = userSkyboxSize ?? 20;
	const cam = scene.camera;
	if (cam && "upperRadiusLimit" in cam && cam.upperRadiusLimit) {
		groundSize = cam.upperRadiusLimit * 2;
		skyboxSize = groundSize;
	}
	if (sceneDiagonalLength > groundSize) {
		groundSize = sceneDiagonalLength * 2;
		skyboxSize = groundSize;
	}
	groundSize *= 1.1;
	skyboxSize *= 1.5;
	const rootPosition = [
		minX + dx * .5,
		minY - 1e-5,
		minZ + dz * .5
	];
	return {
		groundSize,
		skyboxSize,
		rootPosition
	};
}
export { computeSceneSize };

//# sourceMappingURL=scene-size.js.map