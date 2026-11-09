import { tickAnimation } from "../animation/animation-tick.js";
import { _createDirectRenderTarget } from "../engine/render-target.js";
import { isRenderingContextRegistered, registerRenderingContext, unregisterRenderingContext } from "../engine/engine.js";
import { _appendTask, createFrameGraph } from "../frame-graph/frame-graph.js";
import { _createAutomaticRenderTask } from "../frame-graph/render-task-base.js";
import { disposeMeshGpu } from "../mesh/mesh-dispose.js";
import { enqueueMaterialSwap, registerMeshScene, unregisterMeshScene } from "./mesh-scene-registry.js";
import { processMaterialSwaps } from "./scene-material-swap.js";
// src/scene/scene-core.ts
var _lateCleanup = null;
var _sceneChangeHook;
var _sceneDisposeHook;
/** @internal Install the optional generic scene-change seam. */
function _setSceneChangeHook(hook) {
	_sceneChangeHook = hook;
}
/** @internal Install the optional generic scene-disposal seam. */
function _setSceneDisposeHook(hook) {
	_sceneDisposeHook = hook;
}
/** Match the scene camera's floating-origin mode to its engine. A camera can arrive fresh or from an
*  engine with the opposite mode: `getViewMatrix` zeroes the view translation only under the flag. The
*  view cache resets, and clearing the projection snapshot re-arms `_cameraChangeKey` (as on a fresh
*  camera) so its next call advances `_projRev`: the view-projection cache and every change-key
*  consumer (scene UBO, text, CSM, TAA, …) rewrite in this frame. */
function syncCameraFloatingOrigin(scene, fo) {
	const cam = scene.camera;
	if (cam && !cam._useFloatingOrigin !== !fo) {
		cam._useFloatingOrigin = fo;
		cam._viewVer = -1;
		cam._projFov = void 0;
	}
}
/** Create an empty scene context bound to the given `surface`. The default render task
*  is built against the surface's format, MSAA configuration, and swapchain RT — the
*  scene is permanently bound to that surface. Pass `engine` directly (since
*  `EngineContext extends SurfaceContext`) for the common single-canvas case, or pass
*  an auxiliary surface created via `createSurface`. */
function createSceneContext(surface, options) {
	const eng = surface.engine;
	const ctx = {
		_kind: "scene",
		surface,
		clearColor: {
			r: .2,
			g: .2,
			b: .3,
			a: 1
		},
		camera: null,
		lights: [],
		meshes: [],
		animationGroups: [],
		fog: null,
		clipPlane: null,
		shadowGenerators: [],
		imageProcessing: {
			exposure: 1,
			contrast: 1,
			toneMappingEnabled: false
		},
		_renderables: [],
		_prePasses: [],
		_pickSources: [],
		_uniformUpdaters: [],
		fixedDeltaMs: 0,
		_beforeRender: [],
		_deferredBuilders: [],
		_groups: /* @__PURE__ */ new Map(),
		_disposables: [],
		_meshDisposables: /* @__PURE__ */ new Map(),
		_materialSwapQueue: [],
		_renderableVersion: 0,
		_materialEpoch: 0,
		_built: false,
		_drawCallsPre: 0,
		_update() {
			const d = ctx.fixedDeltaMs > 0 ? ctx.fixedDeltaMs : eng._currentDelta;
			const encoder = eng._currentEncoder;
			let draws = 0;
			syncCameraFloatingOrigin(ctx, eng.useFloatingOrigin);
			for (const cb of ctx._beforeRender) cb(d);
			syncCameraFloatingOrigin(ctx, eng.useFloatingOrigin);
			if (ctx._materialSwapQueue.length) processMaterialSwaps(ctx);
			for (const pp of ctx._prePasses) draws += pp.execute(encoder, eng);
			for (const u of ctx._uniformUpdaters) u.update(eng);
			ctx._drawCallsPre = draws;
		},
		_record() {
			return ctx._frameGraph.execute();
		},
		_resize() {
			ctx._frameGraph.build();
		}
	};
	const fg = createFrameGraph(eng);
	ctx._frameGraph = fg;
	if (options?.defaultRenderTask !== false) {
		const msaa = surface.msaaSamples > 1;
		const rt = msaa ? _createDirectRenderTarget({
			lbl: "scene-color",
			format: surface.format,
			dFormat: "depth24plus-stencil8",
			samples: surface.msaaSamples,
			size: surface
		}) : surface.scRT;
		const depth = msaa ? void 0 : _createDirectRenderTarget({
			lbl: "scene-depth",
			dFormat: "depth24plus-stencil8",
			samples: 1,
			size: surface
		});
		_appendTask(fg, _createAutomaticRenderTask({
			name: "scene",
			rt,
			rst: msaa ? surface.scRT : void 0,
			depth
		}, eng, ctx));
	}
	ctx._disposables.push(() => fg.dispose());
	return ctx;
}
/** Register a callback to run before each rendered frame. */
function onBeforeRender(scene, cb) {
	scene._beforeRender.unshift(cb);
}
/** @internal Whether the generic scene-change seam has an installed subscriber. */
function _hasSceneChangeHook() {
	return _sceneChangeHook !== void 0;
}
/** @internal Run one canonical mutation through the installed generic scene-change seam. */
function _runSceneChange(scene, mutation) {
	_sceneChangeHook?.run(scene, mutation);
}
/** @internal Publish one committed membership fact through the installed generic scene-change seam. */
function _notifySceneChange(scene, entity, type) {
	_sceneChangeHook?.record(scene, entity, type);
}
/** Get the scene's frame graph. Always non-null — created in `createSceneContext`. */
function getFrameGraph(scene) {
	return scene._frameGraph;
}
/** @internal Register optional scene-hosted render work without teaching `addToScene` about the feature. */
function addDeferredSceneRenderables(scene, build) {
	const ctx = scene;
	ctx._deferredBuilders.push(async () => {
		const built = await build(ctx.surface.engine, ctx);
		ctx._renderables.push(...built.renderables);
		if (built.dispose) ctx._disposables.push(built.dispose);
	});
}
/**
* Adds an entity (mesh, light, camera, transform node, shadow generator, or asset container)
* to the scene, dispatching on its type. Asset containers are unpacked and each contained
* entity added recursively. Optional scene-hosted systems such as depth-hosted sprites
* expose their own opt-in add functions so mesh-only scenes do not pay feature-specific
* routing bytes here. Adding a camera makes it the scene's active camera (`scene.camera`),
* replacing any previous one; an asset container's camera is only installed when the scene
* has none.
* @param scene - The owning scene (pillar 4b: entities never reference the scene themselves).
* @param entity - The entity (or asset container) to add.
* @throws When `entity` is a mesh that was already disposed — `removeFromScene` (or
* `disposeScene`) releases a mesh's claim on its GPU resources when it leaves its LAST scene, and
* calling the public `disposeMeshGpu(mesh)` yourself does the same. A disposed mesh is retired for
* good; create a new mesh instead of re-adding it. The mesh itself is rejected before any scene
* state is touched; when adding a hierarchy or asset container, entities processed before the
* offending mesh stay added.
*/
function addToScene(scene, entity) {
	if (_sceneChangeHook && scene._sceneChanges && scene._sceneChanges.depth === 0) {
		_sceneChangeHook.run(scene, () => addToScene(scene, entity));
		return;
	}
	const ctx = scene;
	if ("entities" in entity) {
		const result = entity;
		for (const e of result.entities) addToScene(scene, e);
		if (result.clearColor) ctx.clearColor = result.clearColor;
		if (result.camera && !ctx.camera) ctx.camera = result.camera;
		if (result.animationGroups?.length) {
			const engine = ctx.surface.engine;
			const groups = result.animationGroups;
			ctx.animationGroups.push(...groups);
			const hook = (deltaMs) => {
				for (const g of groups) tickAnimation(g, deltaMs, engine);
			};
			result._beforeRenderHook = hook;
			ctx._beforeRender.push(hook);
		}
		result._sceneSetup?.(ctx, result);
		_notifySceneChange(ctx, entity, "added");
		return;
	}
	if ("_gpu" in entity && "material" in entity) {
		const mesh = entity;
		registerMeshScene(ctx, mesh);
		ctx.meshes.push(mesh);
		joinMaterialGroup(ctx, mesh);
		ctx._meshMaterialChange?.(mesh, mesh.material);
	} else if ("lightType" in entity) ctx.lights.push(entity);
	else if ("fov" in entity) ctx.camera = entity;
	_notifySceneChange(ctx, entity, "added");
	const kids = entity.children;
	if (kids?.length) for (const child of kids) {
		child.parent = entity;
		addToScene(scene, child);
	}
}
/** Add `mesh` to the scene group of its current material's builder, creating the group (and, before the initial
*  build, its deferred builder) on first use. */
function joinMaterialGroup(ctx, mesh) {
	const build = mesh.material?._buildGroup;
	if (!build) return;
	let group = ctx._groups.get(build);
	if (!group) {
		group = [];
		ctx._groups.set(build, group);
		if (!ctx._built) ctx._deferredBuilders.push(async () => {
			if (!group[0]) {
				ctx._groups.delete(build);
				return;
			}
			const result = await build(ctx, group);
			ctx._renderables.push(...result.renderables);
			group.o = result.renderables;
			if (result.updater) ctx._uniformUpdaters.push(result.updater);
			group.r = result.rebuildSingle;
		});
	}
	group.push(mesh);
	if (ctx._built || group.r) enqueueMaterialSwap(ctx, mesh);
}
/** Release all GPU resources owned by this scene. */
function disposeScene(scene) {
	const ctx = scene;
	if (ctx._z) return;
	ctx._z = true;
	const lateCleanup = _lateCleanup ??= /* @__PURE__ */ new WeakMap();
	lateCleanup.set(ctx, () => 1);
	unregisterRenderingContext(ctx.surface, ctx);
	const cleanup = () => {
		lateCleanup.set(ctx, () => {
			for (const fns of ctx._meshDisposables.values()) fns.forEach((dispose) => dispose());
			ctx._meshDisposables.clear();
			ctx._disposables.splice(0).forEach((dispose) => dispose());
			ctx._renderables.length = ctx._uniformUpdaters.length = 0;
			return 1;
		});
		ctx._disposables.splice(0).forEach((fn) => fn());
		for (const fns of ctx._meshDisposables.values()) for (const fn of fns) fn();
		ctx._meshDisposables.clear();
		for (const mesh of ctx.meshes) if (unregisterMeshScene(ctx, mesh)) disposeMeshGpu(mesh);
		ctx._groups.clear();
		ctx.meshes.length = 0;
		ctx._renderables.length = 0;
		ctx._prePasses.length = 0;
		ctx._pickSources.length = 0;
		ctx._uniformUpdaters.length = 0;
		ctx._beforeRender.length = 0;
		ctx._deferredBuilders.length = 0;
		ctx._disposables.length = 0;
		ctx._materialSwapQueue.length = 0;
		ctx.lights.length = 0;
		ctx.animationGroups.length = 0;
		ctx.shadowGenerators.length = 0;
		ctx.camera = null;
	};
	_sceneChangeHook?.dispose(ctx);
	if (_sceneDisposeHook) _sceneDisposeHook(ctx, cleanup);
	else cleanup();
}
/** @internal Run all deferred builders (called by registerScene's boot step before the first frame). */
async function buildScene(scene) {
	for (const light of scene.lights) light._validateLighting?.(scene._lighting);
	const ctx = scene;
	if (!ctx._built && ctx._materialSwapQueue.splice(0)[0]) {
		ctx._groups.forEach((group) => group.length = 0);
		ctx.meshes.forEach((mesh) => joinMaterialGroup(ctx, mesh));
	}
	while (ctx._deferredBuilders.length) {
		const builders = ctx._deferredBuilders.splice(0);
		await Promise.all(builders.map((b) => b()));
	}
	await processMaterialSwaps(ctx);
	_lateCleanup?.get(ctx)?.() || (ctx._runtimeBuilds?._e(), ctx._renderableVersion++, ctx._built = true);
	await ctx._rebuildHook?.(ctx);
}
var _prepareShaderPipelines = null;
/** @internal Install the optional async ShaderMaterial preparation boundary. */
function _installAsyncShaderPipelinePreparation(prepare) {
	_prepareShaderPipelines = prepare;
}
var _overlaySceneRegistered;
/** @internal Install overlay-scene handling that runs after any scene is inserted into its surface. */
function _installOverlaySceneRegistration(registered) {
	_overlaySceneRegistered = registered;
}
/**
* Register a scene with the engine. Builds deferred work, sorts renderables by order,
* and adds the scene to its bound surface's render list. A scene clears its target unless
* it was created with `createOverlayScene`, in which case it composites over its base scene
* and is kept immediately after it. The scene is always attached to `scene.surface`
* (which equals the engine itself in the single-canvas case).
*/
async function registerScene(scene) {
	const ctx = scene;
	const surface = ctx.surface;
	if (isRenderingContextRegistered(surface, ctx)) return;
	await buildScene(scene);
	ctx._renderables.sort(byOrder);
	await Promise.all(ctx._frameGraph._tasks.map((task) => task._preload?.()));
	if (_prepareShaderPipelines) await _prepareShaderPipelines(ctx);
	ctx._frameGraph.build();
	_lateCleanup?.get(ctx)?.() || registerRenderingContext(surface, ctx) && _overlaySceneRegistered?.(ctx);
}
/**
* Register a scene with the engine and install the scene-owned shadow frame-graph task.
* Use only for scenes that generate shadow maps. Like {@link registerScene}, the scene
* is attached to `scene.surface` (and its owning engine is `scene.surface.engine`).
*/
async function registerSceneWithShadowSupport(scene) {
	const ctx = scene;
	const surface = ctx.surface;
	if (isRenderingContextRegistered(surface, ctx)) return;
	await buildScene(scene);
	ctx._renderables.sort(byOrder);
	await ensureShadowTask(surface.engine, ctx);
	await Promise.all(ctx._frameGraph._tasks.map((task) => task._preload?.()));
	if (_prepareShaderPipelines) await _prepareShaderPipelines(ctx);
	ctx._frameGraph.build();
	_lateCleanup?.get(ctx)?.() || registerRenderingContext(surface, ctx) && _overlaySceneRegistered?.(ctx);
}
var byOrder = (a, b) => a.order - b.order;
async function ensureShadowTask(engine, scene) {
	if (scene._frameGraph._tasks.some((task) => task.name === "shadow")) return;
	const { createShadowTask } = await import("../frame-graph/shadow-task.js");
	scene._frameGraph._tasks.unshift(createShadowTask(engine, scene));
}
/** Remove a previously-registered scene. Idempotent. Does not dispose scene resources.
*  The scene is always removed from `scene.surface`. */
function unregisterScene(scene) {
	unregisterRenderingContext(scene.surface, scene);
}
export { _hasSceneChangeHook, _installAsyncShaderPipelinePreparation, _installOverlaySceneRegistration, _notifySceneChange, _runSceneChange, _setSceneChangeHook, _setSceneDisposeHook, addDeferredSceneRenderables, addToScene, buildScene, createSceneContext, disposeScene, getFrameGraph, onBeforeRender, registerScene, registerSceneWithShadowSupport, unregisterScene };

//# sourceMappingURL=scene-core.js.map