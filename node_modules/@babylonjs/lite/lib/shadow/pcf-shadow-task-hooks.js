import { F32 } from "../engine/typed-arrays.js";
import { retireGpuResources } from "../engine/gpu-resource-retirement.js";
import { packMat4IntoF32 } from "../math/pack-mat4-into-f32.js";
import { resolveMeshRebuild } from "../material/resolve-mesh-rebuild.js";
import { addMeshToTask, createRenderTask } from "../frame-graph/render-task.js";
import { _getShadowTaskCasterMeshes, setShadowTaskCasterMeshes } from "../frame-graph/shadow-inputs.js";
import { casterVersionSum, createShadowCamera, createShadowRenderTarget, updateShadowCameraBase, writeShadowUboFields } from "./shadow-base.js";
// src/shadow/pcf-shadow-task-hooks.ts
/** Internal PCF shadow task hooks owned by PCF shadow generators. */
var createStandardNoColorMaterialView;
var createPbrNoColorMaterialView;
var createNodeNoColorMaterialView;
var createShaderNoColorMaterialView;
async function preloadPcfShadowTaskState(casterMeshes) {
	const loads = [];
	let needsStandard = false;
	let needsPbr = false;
	let needsNode = false;
	let needsShader = false;
	for (const mesh of casterMeshes) {
		const family = (mesh.material ? resolveShadowCasterMaterial(mesh.material) : void 0)?._buildGroup._materialFamily;
		needsStandard ||= family === "standard";
		needsPbr ||= family === "pbr";
		needsNode ||= family === "node";
		needsShader ||= family === "shader";
	}
	if (needsStandard && !createStandardNoColorMaterialView) loads.push(import("../material/standard/no-color-view.js").then((module) => {
		createStandardNoColorMaterialView = module.createStandardNoColorMaterialView;
	}));
	if (needsPbr && !createPbrNoColorMaterialView) loads.push(import("../material/pbr/no-color-view.js").then((module) => {
		createPbrNoColorMaterialView = module.createPbrNoColorMaterialView;
	}));
	if (needsNode && !createNodeNoColorMaterialView) loads.push(import("../material/node/no-color-view.js").then((module) => {
		createNodeNoColorMaterialView = module.createNodeNoColorMaterialView;
	}));
	if (needsShader && !createShaderNoColorMaterialView) loads.push(import("../material/shader/no-color-view.js").then((module) => {
		createShaderNoColorMaterialView = module.createShaderNoColorMaterialView;
	}));
	await Promise.all(loads);
}
function ensurePcfShadowTaskState(engine, scene, sg, casterMeshes, existingState) {
	const existing = existingState;
	if (existing) {
		let changed = existing._casterMeshes !== casterMeshes;
		for (let i = 0; !changed && i < casterMeshes.length; i++) {
			const mesh = casterMeshes[i];
			const material = mesh.material;
			const terminal = material ? resolveShadowCasterMaterial(material) : null;
			const features = terminal?._renderFeatures;
			if (existing._casterMaterials[i] !== terminal || existing._casterMatGens[i] !== (terminal?._csmGen ?? 0) || existing._casterMeshGens[i] !== mesh._renderableGen || !!features && existing._casterMatFeatures[i] !== features) changed = !(material && existing._held?.has(mesh) && holdShadowCaster(scene, sg, material));
		}
		if (!changed) return existing;
		retireGpuResources(engine, existing._task.dispose);
	}
	const materialViews = /* @__PURE__ */ new Map();
	const casterMaterials = [];
	const casterMatGens = [];
	const casterMeshGens = [];
	const casterMatFeatures = [];
	const camera = createShadowCamera(sg);
	const rt = createShadowRenderTarget(sg);
	const state = {
		_task: createRenderTask({
			name: "pcf",
			rt,
			clr: true,
			cam: camera,
			autoMirror: false,
			_skipClusteredLights: true
		}, engine, scene),
		_camera: camera,
		_lastCasterVersion: -1,
		_lastLightVersion: -1,
		_lastFoVersion: -1,
		_shadowUboData: new F32(24),
		_casterMeshes: casterMeshes,
		_casterMaterials: casterMaterials,
		_casterMatGens: casterMatGens,
		_casterMeshGens: casterMeshGens,
		_casterMatFeatures: casterMatFeatures,
		_scene: scene
	};
	for (const mesh of casterMeshes) {
		const material = mesh.material;
		casterMeshGens.push(mesh._renderableGen);
		if (material && holdShadowCaster(scene, sg, material)) {
			(state._held ??= /* @__PURE__ */ new Set()).add(mesh);
			casterMaterials.push(null);
			casterMatGens.push(0);
			casterMatFeatures.push(void 0);
			continue;
		}
		const terminal = material ? resolveShadowCasterMaterial(material) : null;
		casterMaterials.push(terminal);
		casterMatGens.push(terminal?._csmGen ?? 0);
		casterMatFeatures.push(terminal?._renderFeatures);
		if (material) addMeshToTask(state._task, mesh, { material: getNoColorView(material, materialViews) });
	}
	return state;
}
/** @internal Whether the no-colour view of a caster material cannot be built yet, so the caster has to stay out of the
*  shadow task for now. When the view factory of the family the caster casts through is not imported, building the view
*  would call an undefined factory: this re-supplies the generator's registered caster set through
*  `setShadowTaskCasterMeshes`, which parks the generator while the factory imports, as any re-supplied set does. A caster
*  casting through its own material also waits while that material's group is not built in this scene, or recording the
*  view would throw inside the frame: the mesh's swap drain or runtime build builds it. A build that fails reports its own
*  error, and the hold lasts until the caster's material is reassigned or the caster leaves the set. A
*  `setShadowCasterMaterial` override does not wait for its group, since nothing in the caster's lifecycle builds it:
*  recording it throws as before, naming the problem. Shared by the PCF and CSM hooks. */
function holdShadowCaster(scene, sg, material) {
	const terminal = resolveShadowCasterMaterial(material);
	if (!hasNoColorViewFactory(terminal)) {
		const registered = _getShadowTaskCasterMeshes(sg);
		if (registered && !sg._preloadPending) setShadowTaskCasterMeshes(sg, registered);
		return true;
	}
	return terminal === material && !resolveMeshRebuild(scene, terminal._buildGroup);
}
/** @internal Resolve the terminal material used by the shadow caster view. */
function resolveShadowCasterMaterial(material) {
	let terminal = material;
	while (terminal._shadowCasterMaterial) terminal = terminal._shadowCasterMaterial;
	return terminal;
}
/** @internal Record the terminal caster identity, generation and render features for invalidation checks. */
function snapshotShadowCasterMaterial(material, terminals, generations, features) {
	const terminal = resolveShadowCasterMaterial(material);
	terminals.set(material, terminal);
	generations.set(material, terminal._csmGen);
	features.set(material, terminal._renderFeatures);
}
/** @internal Whether an override changed, was cleared, or its terminal material was rebuilt (`_csmGen`) or has
*  recomputed render features: a no-colour view copies the features it was built from, and some changes (material
*  plugins) only drop `_renderFeatures` and rebuild the material's meshes one by one. Dropped features that are not
*  recomputed yet do not count: a view built now would read none of them, so the current one stays until the rebuild
*  recomputes them. A material missing from the snapshot counts as changed too: the snapshot cannot vouch for a view
*  that was never built for it. */
function shadowCasterMaterialChanged(material, terminals, generations, features) {
	const terminal = resolveShadowCasterMaterial(material);
	const current = terminal._renderFeatures;
	return terminals.get(material) !== terminal || generations.get(material) !== terminal._csmGen || !!current && features.get(material) !== current;
}
/** Whether `getNoColorView` can build the view of a terminal caster material now: the no-colour view factory of its family
*  has been imported. A family without a factory builds no view, so it needs none. */
function hasNoColorViewFactory(terminal) {
	const family = terminal._buildGroup._materialFamily;
	return !!(family === "standard" ? createStandardNoColorMaterialView : family === "pbr" ? createPbrNoColorMaterialView : family === "node" ? createNodeNoColorMaterialView : family !== "shader" || createShaderNoColorMaterialView);
}
function renderPcfShadowMap(engine, sg, state, computeLightMatrix) {
	const casterMeshes = state._casterMeshes;
	const casterVersion = casterVersionSum(casterMeshes);
	const lightVersion = sg._light._lightVersion;
	const foCam = engine.useFloatingOrigin ? state._scene.camera : null;
	const foVersion = foCam ? foCam.worldMatrixVersion : 0;
	const offX = foCam ? foCam.worldMatrix[12] : 0;
	const offY = foCam ? foCam.worldMatrix[13] : 0;
	const offZ = foCam ? foCam.worldMatrix[14] : 0;
	const foChanged = foVersion !== state._lastFoVersion || foCam !== state._lastFoCamera;
	if (!sg._config._forceRefreshEveryFrame && casterVersion === state._lastCasterVersion && lightVersion === state._lastLightVersion && !foChanged) return 0;
	const matrix = computeLightMatrix(casterMeshes, offX, offY, offZ);
	if (sg._light.lightType === "directional" || lightVersion !== state._lastLightVersion || foChanged) {
		packMat4IntoF32(sg._lightMatrix, matrix._viewProj, 0);
		sg._version++;
		writeShadowUboFields(state._shadowUboData, sg);
		engine._device.queue.writeBuffer(sg._shadowUBO, 0, state._shadowUboData);
	}
	updateShadowCamera(state, sg, matrix);
	state._lastCasterVersion = casterVersion;
	state._lastLightVersion = lightVersion;
	state._lastFoVersion = foVersion;
	state._lastFoCamera = foCam;
	return state._task.execute?.() ?? 0;
}
function updateShadowCamera(state, sg, matrix) {
	const camera = state._camera;
	camera.fov = sg._light.lightType === "spot" ? sg._light.angle : 1;
	updateShadowCameraBase(camera, camera.worldMatrixVersion + 1, matrix._near, matrix._far, matrix._view, biasViewProjection(matrix._viewProj, sg._config._bias));
}
function biasViewProjection(viewProj, bias) {
	const biased = new F32(viewProj);
	const b = bias * .5;
	for (let col = 0; col < 4; col++) {
		const z = 2 + col * 4;
		const w = 3 + col * 4;
		biased[z] = biased[z] + b * biased[w];
	}
	return biased;
}
function getNoColorView(material, cache) {
	const cached = cache.get(material);
	if (cached) return cached;
	const override = material._shadowCasterMaterial;
	if (override) {
		const overrideView = getNoColorView(override, cache);
		cache.set(material, overrideView);
		return overrideView;
	}
	const family = material._buildGroup._materialFamily;
	let view;
	if (family === "standard") view = createStandardNoColorMaterialView(material);
	else if (family === "pbr") view = createPbrNoColorMaterialView(material);
	else if (family === "node") view = createNodeNoColorMaterialView(material);
	else if (family === "shader") view = createShaderNoColorMaterialView(material);
	cache.set(material, view);
	return view;
}
export { ensurePcfShadowTaskState, getNoColorView, holdShadowCaster, preloadPcfShadowTaskState, renderPcfShadowMap, resolveShadowCasterMaterial, shadowCasterMaterialChanged, snapshotShadowCasterMaterial };

//# sourceMappingURL=pcf-shadow-task-hooks.js.map