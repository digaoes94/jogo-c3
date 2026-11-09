import { getViewMatrix, getViewProjectionMatrix } from "../camera/camera.js";
import { packMat4IntoF32 } from "../math/pack-mat4-into-f32.js";
// src/frame-graph/scene-uniforms-pack.ts
/** Pack the always-present SceneUniforms fields into `data` (length
*  SCENE_UBO_BYTES/4). Zeroes the buffer first, then writes the universal
*  camera / eye / image-processing fields every scene needs.
*
*  The opt-in environment rotation (offset 36), IBL spherical-harmonics
*  (40–75), fog (80–86), and clip-plane (88–91) slices are NOT written here — they are owned by the
*  scene-UBO contributors registered through the {@link setFog}/{@link
*  setClipPlane}/env-loader seam. The forward {@link RenderTask} and the
*  {@link createGeometryRendererTask} run those contributors after this base
*  pack, so fog/clip/env code only ships in scenes that actually use them.
*  Pure — does not touch the GPU. */
function _packSceneUniforms(data, eng, scene, camera, aspect) {
	data.fill(0);
	const viewProj = getViewProjectionMatrix(camera, aspect);
	const viewMat = getViewMatrix(camera);
	const wm = camera.worldMatrix;
	packMat4IntoF32(data, viewProj, 0);
	packMat4IntoF32(data, viewMat, 16);
	if (eng.useFloatingOrigin) {
		data[32] = 0;
		data[33] = 0;
		data[34] = 0;
	} else {
		data[32] = wm[12];
		data[33] = wm[13];
		data[34] = wm[14];
	}
	data[87] = eng.canvas.width;
	const img = scene.imageProcessing;
	data[76] = img.exposure;
	data[77] = img.contrast;
	data[78] = scene._envTextures?.lodGenerationScale ?? .8;
	data[79] = +img.toneMappingEnabled;
	data[37] = eng.canvas.height;
}
export { _packSceneUniforms };

//# sourceMappingURL=scene-uniforms-pack.js.map