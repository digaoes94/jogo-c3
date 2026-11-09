import { t as buildSkyboxCubeMapGPU } from "../_chunks/skybox-cubemap-C-xU6hSy.js";
// src/loader-skybox/skybox-renderable.ts
/** Build a skybox Renderable from a SkyboxData (loaded via loadSkybox). */
function buildSkyboxRenderable(scene, skybox) {
	const engine = scene.surface.engine;
	const gpu = buildSkyboxCubeMapGPU(engine, skybox.worldMatrix, skybox.cubeView, skybox.cubeSampler);
	const r = {
		order: 0,
		isTransparent: false,
		bind(eng, sig) {
			const pipeline = gpu.getPipeline(eng, sig);
			return {
				renderable: r,
				pipeline,
				draw(pass) {
					pass.setBindGroup(1, gpu.meshBindGroup);
					pass.setVertexBuffer(0, skybox.posBuffer);
					pass.setVertexBuffer(1, skybox.normBuffer);
					pass.setIndexBuffer(skybox.idxBuffer, "uint32");
					pass.drawIndexed(skybox.idxCount);
					return 1;
				}
			};
		}
	};
	return r;
}
export { buildSkyboxRenderable };

//# sourceMappingURL=skybox-renderable.js.map