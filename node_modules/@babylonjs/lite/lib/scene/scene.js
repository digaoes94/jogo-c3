import { setSubtreeVisible } from "./visibility.js";
import { processMaterialSwaps } from "./scene-material-swap.js";
import { addToScene, buildScene, createSceneContext, disposeScene, getFrameGraph, onBeforeRender, registerScene, registerSceneWithShadowSupport, unregisterScene } from "./scene-core.js";
import { removeFromScene } from "./scene-remove.js";
import { onSceneChange, onSceneDispose } from "./scene-change.js";
import { createDefaultCamera } from "./scene-camera.js";
export { addToScene, buildScene, createDefaultCamera, createSceneContext, disposeScene, getFrameGraph, onBeforeRender, onSceneChange, onSceneDispose, processMaterialSwaps, registerScene, registerSceneWithShadowSupport, removeFromScene, setSubtreeVisible as setMeshVisible, unregisterScene };
