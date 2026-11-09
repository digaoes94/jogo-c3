import { F32 } from "../engine/typed-arrays.js";
import { BU } from "../engine/gpu-flags.js";
import { createMappedBuffer } from "../resource/mapped-buffer.js";
import { createBoxData } from "../mesh/create-box.js";
import { loadCubeTexture } from "../texture/cube-texture.js";
// src/loader-skybox/load-skybox.ts
/** High-level skybox loader.
*  Loads a cube texture and registers a skybox for the auto-builder. */
/** Load a skybox cube texture and register it on the scene.
*  The auto-builder will create the pipeline and render it.
*
*  @param scene   - Scene to register the skybox in
*  @param baseUrl - Base URL for cube faces (e.g., 'textures/skybox')
*  @param ext     - File extension (e.g., '.jpg', '.png')
*  @param size    - Box size (default 100, matches Babylon)
*/
async function loadSkybox(scene, baseUrl, ext, size = 100) {
	const eng = scene.surface.engine;
	const cubeTex = await loadCubeTexture(eng, baseUrl, ext);
	const boxData = createBoxData(size);
	const posBuffer = createMappedBuffer(eng, boxData.positions, BU.VERTEX);
	const normBuffer = createMappedBuffer(eng, boxData.normals, BU.VERTEX);
	const idxBuffer = createMappedBuffer(eng, boxData.indices, BU.INDEX);
	const world = new F32(16);
	world[0] = 1;
	world[5] = 1;
	world[10] = 1;
	world[15] = 1;
	const skyboxData = {
		cubeView: cubeTex._view,
		cubeSampler: cubeTex._sampler,
		posBuffer,
		normBuffer,
		idxBuffer,
		idxCount: boxData.indices.length,
		worldMatrix: world
	};
	const { buildSkyboxRenderable } = await import("./skybox-renderable.js");
	scene._renderables.push(buildSkyboxRenderable(scene, skyboxData));
}
export { loadSkybox };

//# sourceMappingURL=load-skybox.js.map