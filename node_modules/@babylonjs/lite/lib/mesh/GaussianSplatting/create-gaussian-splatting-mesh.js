import { U8 } from "../../engine/typed-arrays.js";
import { buildSplatGeometry } from "../../loader-splat/splat-data.js";
import { createGaussianSplattingMesh } from "./gaussian-splatting-mesh.js";
import { n as attachGaussianSplattingMesh } from "../../_chunks/gaussian-splatting-pipeline-eY0rwrgD.js";
import { t as WorkerWrapper } from "../../_chunks/splat-sort-worker-dzJy4yzm.js";
// src/mesh/GaussianSplatting/create-gaussian-splatting-mesh.ts
/**
* Creates a Gaussian Splatting mesh with `splatCount` placeholder splats and attaches
* it to the scene's render pipeline. Useful for procedurally filling splat data later.
* @param scene - Scene that owns and renders the mesh.
* @param name - Mesh name.
* @param splatCount - Number of splats to allocate.
* @param fragments - Optional custom shader fragments for the splat material.
* @returns The created, scene-attached Gaussian Splatting mesh.
*/
function createProceduralGaussianSplattingMesh(scene, name, splatCount, fragments) {
	const ROW = 32;
	const buffer = /* @__PURE__ */ new ArrayBuffer(ROW * splatCount);
	const u8 = new U8(buffer);
	for (let i = 0; i < splatCount; i++) {
		u8[i * ROW + 24 + 3] = 255;
		u8[i * ROW + 28 + 0] = 255;
		u8[i * ROW + 28 + 1] = 128;
		u8[i * ROW + 28 + 2] = 128;
		u8[i * ROW + 28 + 3] = 128;
	}
	const parsed = { data: buffer };
	const geom = buildSplatGeometry(parsed.data);
	const worker = new WorkerWrapper({ name: "babylon-lite-splat-sort" });
	const eng = scene.surface.engine;
	const mesh = createGaussianSplattingMesh(eng, name, geom, worker, parsed);
	attachGaussianSplattingMesh(scene, mesh, fragments);
	return mesh;
}
export { createProceduralGaussianSplattingMesh };

//# sourceMappingURL=create-gaussian-splatting-mesh.js.map