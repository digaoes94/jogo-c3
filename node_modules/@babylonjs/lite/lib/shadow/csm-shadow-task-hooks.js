import { _cameraChangeKey, getEffectiveAspectRatio, getViewProjectionMatrix } from "../camera/camera.js";
import { _enableTaskMeshPopulation, addMeshToTask, createRenderTask } from "../frame-graph/render-task.js";
import { invertMat4ToRefOrIdentity } from "../math/invert-mat4-to-ref-or-identity.js";
import { casterVersionSum, createShadowCamera, updateShadowCameraBase } from "./shadow-base.js";
import { getNoColorView, holdShadowCaster, preloadPcfShadowTaskState, shadowCasterMaterialChanged, snapshotShadowCasterMaterial } from "./pcf-shadow-task-hooks.js";
import { _rightHanded } from "#coordinate-system";
// src/shadow/csm-shadow-task-hooks.ts
var preloadCsmShadowTaskState = preloadPcfShadowTaskState;
/** @internal Allocate fixed-size scratch storage for zero-allocation per-frame cascade fitting. */
function _createCascadeScratch(n) {
	const transforms = [];
	const views = [];
	for (let i = 0; i < n; i++) {
		transforms.push(/* @__PURE__ */ new Float32Array(16));
		views.push(/* @__PURE__ */ new Float32Array(16));
	}
	return {
		_cascades: {
			_transforms: transforms,
			_views: views,
			_near: new Array(n).fill(0),
			_far: new Array(n).fill(0),
			_viewFrustumZ: new Array(n).fill(0),
			_frustumLengths: new Array(n).fill(0)
		},
		_view: /* @__PURE__ */ new Float32Array(16),
		_invViewProj: /* @__PURE__ */ new Float32Array(16),
		_corners: Array.from({ length: 8 }, () => [
			0,
			0,
			0
		]),
		_aabb: [
			0,
			0,
			0,
			0,
			0,
			0
		]
	};
}
/** Build (or reuse) the CSM task state: N per-layer depth render targets + cameras + tasks. They are built once;
*  later caster-set and caster-material changes are reconciled into the same tasks (`_reconcileCsmCasters`). */
function ensureCsmShadowTaskState(engine, scene, sg, cfg, casterMeshes, existingState) {
	const existing = existingState;
	if (existing) {
		_reconcileCsmCasters(scene, sg, existing, casterMeshes);
		return existing;
	}
	const materialViews = /* @__PURE__ */ new Map();
	const n = cfg._numCascades;
	const tasks = [];
	const cameras = [];
	for (let i = 0; i < n; i++) {
		const layerView = sg._depthTexture.createView({
			dimension: "2d",
			baseArrayLayer: i,
			arrayLayerCount: 1
		});
		const rt = {
			_descriptor: {
				size: {
					width: cfg._mapSize,
					height: cfg._mapSize
				},
				dFormat: "depth32float",
				depthClearValue: 1,
				depthCompare: "less-equal",
				samples: 1
			},
			_colorTexture: null,
			_colorView: null,
			_depthTexture: sg._depthTexture,
			_depthView: layerView,
			_width: cfg._mapSize,
			_height: cfg._mapSize,
			_eager: true,
			_ownsDepthTexture: false
		};
		const camera = createShadowCamera(sg);
		const task = createRenderTask({
			name: `csm${i}`,
			rt,
			clr: true,
			cam: camera,
			autoMirror: false,
			_skipClusteredLights: true
		}, engine, scene);
		for (const mesh of casterMeshes) {
			const material = mesh.material;
			if (material && i <= (mesh._shadowMaxCascade ?? i)) addMeshToTask(task, mesh, { material: getNoColorView(material, materialViews) });
		}
		tasks.push(task);
		cameras.push(camera);
	}
	const compositeTask = {
		record() {
			for (const t of tasks) t.record();
		},
		execute() {
			let draws = 0;
			for (const t of tasks) draws += t.execute?.() ?? 0;
			return draws;
		},
		dispose() {
			for (const t of tasks) t.dispose();
		}
	};
	const casterMatGens = /* @__PURE__ */ new Map();
	const casterMatFeatures = /* @__PURE__ */ new Map();
	const casterMaterials = /* @__PURE__ */ new Map();
	const casterMaxCascades = /* @__PURE__ */ new Map();
	const casterGens = /* @__PURE__ */ new Map();
	let held;
	for (const m of casterMeshes) if (m.material) {
		casterMaxCascades.set(m, m._shadowMaxCascade);
		casterGens.set(m, m._renderableGen);
		snapshotShadowCasterMaterial(m.material, casterMaterials, casterMatGens, casterMatFeatures);
	} else (held ??= /* @__PURE__ */ new Set()).add(m);
	return {
		_task: compositeTask,
		_tasks: tasks,
		_cameras: cameras,
		_scene: scene,
		_lastCasterVersion: -1,
		_lastLightVersion: -1,
		_lastCamVersion: -1,
		_lastCamera: null,
		_lastCamAspect: -1,
		_uboData: /* @__PURE__ */ new Float32Array(80),
		_casterMeshes: casterMeshes,
		_materialViews: materialViews,
		_casterMaterials: casterMaterials,
		_casterMatGens: casterMatGens,
		_casterMatFeatures: casterMatFeatures,
		_casterMaxCascades: casterMaxCascades,
		_casterGens: casterGens,
		_held: held,
		_cascadeScratch: _createCascadeScratch(n)
	};
}
/** @internal Reconcile a live CSM task state with the current caster array and caster materials.
*
*  Every cascade task, target and camera is kept. Only casters that left the set, changed their cascade cap, or cast
*  through a stale no-colour view are dropped, in one pass per task; unchanged casters keep their resolved packets. The
*  dropped casters that are still in the set are queued again: through a fresh view when theirs was stale, and through
*  the cached view of their material when only their cap changed. A view is stale when the caster's material was
*  rebuilt (`_csmGen`), had its render features invalidated or was re-pointed (`setShadowCasterMaterial`) since the
*  snapshot, or when its material is missing from it: the caster switched material or got its first one, or it joins
*  with an unseen material, whose chain may hold a view another caster's chain cached before the terminal was rebuilt.
*  A caster whose own renderable was rebuilt since it was queued (`Mesh._renderableGen`: a material assignment, a
*  runtime add, replaced geometry) is dropped and requeued too, alone and through the cached view of its material: its
*  packets may reference the per-mesh resources that rebuild retired, and the other casters of the material keep theirs.
*
*  A changed caster whose view cannot be built yet (`holdShadowCaster`) is held instead, without holding back any other
*  caster: it leaves every task once, its packets retired behind the frame fence, since they may reference per-mesh
*  resources retired with its previous material, possibly in a frame this reconcile did not see (the generator was
*  parked). A registered one keeps its cap entry, and its material is not snapshotted, so it still reads as changed and
*  is requeued through a fresh view once the hold lifts, or rejoins if its change is reverted. A caster without a
*  material and without a packet (one held before, one that never joined, or one re-capped without a material, whose
*  packets are dropped then) waits the same way until a material is assigned. The hold is decided per material, so
*  every caster of a held material waits: queueing a new one would snapshot the material, and a registered caster
*  sharing it would then never be requeued. The held casters are kept as `_held`; while they are unchanged, the same
*  caster array with no stale material returns at once, so an unresolved hold costs a scan and no task. A hold that
*  lifts or changes runs the reconcile again, also when no scene version moves (a view factory import lands, a change
*  is reverted).
*
*  Nothing is resolved here: when a caster was queued, the shadow scheduler records each cascade once (forced through
*  `_recordedVersion`), so K requeued casters cost one transaction per cascade instead of one whole-task rebind per
*  caster. A drop alone needs no record, only a redraw. When a caster was dropped or queued, the material snapshots and
*  views are pruned to what the live casters reach, and the dropped casters (possibly none) are returned so a caller
*  with more tasks can update them too; a new array with the same members, caps and unchanged materials, also while a
*  caster stays held, is only adopted: no task or bundle is touched, and undefined is returned. */
function _reconcileCsmCasters(scene, sg, state, casterMeshes) {
	const views = state._materialViews;
	const materials = state._casterMaterials;
	const gens = state._casterMatGens;
	const features = state._casterMatFeatures;
	const caps = state._casterMaxCascades;
	const casterGens = state._casterGens;
	const tasks = state._tasks;
	const last = state._held;
	let stale;
	let held;
	let rebuilt;
	for (const mesh of casterMeshes) {
		const material = mesh.material;
		if (!material) {
			if (last?.has(mesh) || !caps.has(mesh) || mesh._shadowMaxCascade !== caps.get(mesh)) (held ??= /* @__PURE__ */ new Set()).add(mesh);
		} else if (shadowCasterMaterialChanged(material, materials, gens, features)) {
			if (holdShadowCaster(scene, sg, material)) (held ??= /* @__PURE__ */ new Set()).add(mesh);
			else (stale ??= /* @__PURE__ */ new Set()).add(material);
		} else if (caps.has(mesh) && !last?.has(mesh) && casterGens.get(mesh) !== mesh._renderableGen) (rebuilt ??= /* @__PURE__ */ new Set()).add(mesh);
	}
	if (last && held?.size === last.size && [...held].every((mesh) => last.has(mesh))) held = last;
	if (!stale && !rebuilt && held === last && state._casterMeshes === casterMeshes) return;
	for (const material of stale ?? []) for (let link = material; link; link = link._shadowCasterMaterial) views.delete(link);
	const next = new Set(casterMeshes);
	const drop = /* @__PURE__ */ new Set();
	for (const mesh of state._casterMeshes) {
		const material = mesh.material;
		if (held?.has(mesh)) {
			if (!last?.has(mesh) && caps.has(mesh)) drop.add(mesh);
		} else if (!next.has(mesh) || material && stale?.has(material) || rebuilt?.has(mesh) || mesh._shadowMaxCascade !== caps.get(mesh)) {
			caps.delete(mesh);
			casterGens.delete(mesh);
			drop.add(mesh);
		}
	}
	if (drop.size) for (const task of tasks) _dropTaskMeshes(task, drop);
	let queued = false;
	for (const mesh of casterMeshes) {
		const material = mesh.material;
		const maxCascade = mesh._shadowMaxCascade;
		if (held?.has(mesh)) continue;
		if ((!caps.has(mesh) || last?.has(mesh)) && material) {
			queued = true;
			const view = getNoColorView(material, views);
			for (let c = 0; c < tasks.length && c <= (maxCascade ?? c); c++) {
				const task = tasks[c];
				_enableTaskMeshPopulation(task);
				task._pendingMeshes.push({
					mesh,
					material: view ?? material
				});
			}
			casterGens.set(mesh, mesh._renderableGen);
			snapshotShadowCasterMaterial(material, materials, gens, features);
		}
		caps.set(mesh, maxCascade);
	}
	state._casterMeshes = casterMeshes;
	state._held = held;
	if (!drop.size && !queued) return;
	for (const task of tasks) {
		task._lastVersion = -1;
		task._ob.length = 0;
	}
	const used = /* @__PURE__ */ new Set();
	const links = /* @__PURE__ */ new Set();
	for (const mesh of casterMeshes) {
		const material = mesh.material;
		if (material) used.add(material);
		for (let link = material; link; link = link._shadowCasterMaterial) links.add(link);
	}
	for (const material of materials.keys()) if (!used.has(material)) {
		materials.delete(material);
		gens.delete(material);
		features.delete(material);
	}
	for (const material of views.keys()) if (!links.has(material)) views.delete(material);
	state._lastCasterVersion = -1;
	if (queued) state._recordedVersion = -1;
	return drop;
}
/** @internal Remove every mesh in `drop` from one task with one pass over each of its lists, instead of one
*  `removeMeshFromTask` scan and draw-batch re-selection per removed mesh. Like `_removeMeshFromRenderTask`, it
*  re-selects the batches and invalidates the bundle only when something was removed. The task's `_removeMesh`
*  hook is deliberately not called: CSM cascade tasks are internal and never wrapped by
*  `enableRenderTaskMeshRefresh`. */
function _dropTaskMeshes(task, drop) {
	let removed = false;
	const prune = (list, meshOf, onDrop) => {
		let kept = 0;
		for (const entry of list) if (drop.has(meshOf(entry))) {
			onDrop?.(entry);
			removed = true;
		} else list[kept++] = entry;
		list.length = kept;
	};
	prune(task._pendingMeshes ?? [], (request) => request.mesh);
	prune(task._renderables, (renderable) => renderable.mesh, (renderable) => task._retireRenderable?.(task.engine, renderable));
	for (const bindings of [
		task._opaqueBindings,
		task._directBindings,
		task._transparentBindings
	]) prune(bindings, (binding) => binding.renderable.mesh);
	if (removed) {
		const previous = task._batchState;
		task._batchState = previous?._select([
			task._opaqueBindings,
			task._directBindings,
			task._transparentBindings
		]);
		previous?._release(task.engine, [task._batchState]);
		task._ob.length = 0;
		task._lastVersion = -1;
	}
}
/** Render every cascade layer for this frame, recomputing splits/matrices from the active camera. */
function renderCsmShadowMap(engine, sg, state, cfg) {
	const casterMeshes = state._casterMeshes;
	const camera = state._scene.camera;
	if (!camera) return 0;
	const casterVersion = casterVersionSum(casterMeshes);
	const lightVersion = sg._light._lightVersion;
	const camVersion = _cameraChangeKey(camera);
	const camAspect = csmCameraAspect(state._scene, camera);
	if (!cfg._forceRefreshEveryFrame && casterVersion === state._lastCasterVersion && lightVersion === state._lastLightVersion && camVersion === state._lastCamVersion && camera === state._lastCamera && camAspect === state._lastCamAspect) return 0;
	const cascades = _computeCsmCascades(state._scene, camera, sg._light, cfg, state._casterMeshes, state._cascadeScratch);
	_writeCsmUbo(state._uboData, cascades, cfg);
	sg._version++;
	engine._device.queue.writeBuffer(sg._shadowUBO, 0, state._uboData);
	const receiverCbs = sg._onReceiverData;
	if (receiverCbs) for (let i = 0; i < receiverCbs.length; i++) receiverCbs[i](state._uboData);
	for (let i = 0; i < cascades._transforms.length; i++) {
		const cam = state._cameras[i];
		cam.fov = 1;
		const clipBias = cfg._worldSpaceBias === null ? cfg._bias * .5 : csmWorldBiasClipOffset(cfg._worldSpaceBias, cascades._near[i], cascades._far[i]);
		_biasViewProjection(cascades._transforms[i], clipBias);
		updateShadowCameraBase(cam, cam.worldMatrixVersion + 1, cascades._near[i], cascades._far[i], cascades._views[i], cascades._transforms[i]);
	}
	state._lastCasterVersion = casterVersion;
	state._lastLightVersion = lightVersion;
	state._lastCamVersion = camVersion;
	state._lastCamera = camera;
	state._lastCamAspect = camAspect;
	return state._task.execute?.() ?? 0;
}
/** Lite reverse-Z NDC frustum corners (near z=1, far z=0); xy each -1 or +1. */
var FRUSTUM_NDC = [
	[
		-1,
		1,
		1
	],
	[
		1,
		1,
		1
	],
	[
		1,
		-1,
		1
	],
	[
		-1,
		-1,
		1
	],
	[
		-1,
		1,
		0
	],
	[
		1,
		1,
		0
	],
	[
		1,
		-1,
		0
	],
	[
		-1,
		-1,
		0
	]
];
var DEFAULT_BOUND_MIN = [
	-.5,
	-.5,
	-.5
];
var DEFAULT_BOUND_MAX = [
	.5,
	.5,
	.5
];
/** @internal Build a light-space view matrix into caller-owned storage. */
function buildLightViewMatrixInto(out, dirX, dirY, dirZ, px, py, pz) {
	const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
	const fx = dirX / len;
	const fy = dirY / len;
	const fz = dirZ / len;
	let upX = 0;
	let upY = 1;
	let upZ = 0;
	if (Math.abs(fy) > .99) {
		upX = 0;
		upY = 0;
		upZ = 1;
	}
	let rx = upY * fz - upZ * fy;
	let ry = upZ * fx - upX * fz;
	let rz = upX * fy - upY * fx;
	const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
	rx /= rLen;
	ry /= rLen;
	rz /= rLen;
	const ux = fy * rz - fz * ry;
	const uy = fz * rx - fx * rz;
	const uz = fx * ry - fy * rx;
	if (_rightHanded !== null) {
		rx = -rx;
		ry = -ry;
		rz = -rz;
	}
	out[0] = rx;
	out[1] = ux;
	out[2] = fx;
	out[3] = 0;
	out[4] = ry;
	out[5] = uy;
	out[6] = fy;
	out[7] = 0;
	out[8] = rz;
	out[9] = uz;
	out[10] = fz;
	out[11] = 0;
	out[12] = -(rx * px + ry * py + rz * pz);
	out[13] = -(ux * px + uy * py + uz * pz);
	out[14] = -(fx * px + fy * py + fz * pz);
	out[15] = 1;
}
/** Transform a point by a 4×4 column-major matrix with perspective divide. */
function transformCoordInto(out, m, x, y, z) {
	const X = m[0] * x + m[4] * y + m[8] * z + m[12];
	const Y = m[1] * x + m[5] * y + m[9] * z + m[13];
	const Z = m[2] * x + m[6] * y + m[10] * z + m[14];
	const W = m[3] * x + m[7] * y + m[11] * z + m[15];
	out[0] = X / W;
	out[1] = Y / W;
	out[2] = Z / W;
}
/** Multiply an orthographic off-center projection directly by an affine light view. */
function orthoViewInto(out, view, l, r, b, t, n, f) {
	const sx = 2 / (r - l);
	const sy = 2 / (t - b);
	const sz = 1 / (f - n);
	const tx = -(r + l) / (r - l);
	const ty = -(t + b) / (t - b);
	const tz = -n / (f - n);
	for (let column = 0; column < 4; column++) {
		const i = column * 4;
		const w = view[i + 3];
		out[i] = sx * view[i] + tx * w;
		out[i + 1] = sy * view[i + 1] + ty * w;
		out[i + 2] = sz * view[i + 2] + tz * w;
		out[i + 3] = w;
	}
}
/** Effective aspect of the surface the scene actually renders into.
*
*  Not `engine.canvas`: a scene is bound to `scene.surface` (an `EngineContext` is itself a
*  `SurfaceContext`, so that is the canvas for the common single-surface case, but an
*  auxiliary surface created via `createSurface` has its own swapchain size). Fitting
*  cascades to the canvas would use a frustum the scene never draws. `getEffectiveAspectRatio`
*  additionally folds in the camera's normalized viewport, matching `_writePassSceneUBO`. */
function csmCameraAspect(scene, camera) {
	const rt = scene.surface.scRT;
	return getEffectiveAspectRatio(camera, rt._width, rt._height);
}
/** @internal Write the eight world-space corners of the camera frustum slice between the fractions `nearSplit` and
*  `farSplit` of the camera depth range into `corners` (near quad first, then far quad). `invViewProj` is the inverse
*  of the camera view-projection. The one owner of the slice geometry the cascade fit covers. */
function _csmSliceCornersInto(corners, invViewProj, nearSplit, farSplit) {
	for (let k = 0; k < 8; k++) {
		const ndc = FRUSTUM_NDC[k];
		transformCoordInto(corners[k], invViewProj, ndc[0], ndc[1], ndc[2]);
	}
	for (let k = 0; k < 4; k++) {
		const nearCorner = corners[k];
		const farCorner = corners[k + 4];
		const rx = farCorner[0] - nearCorner[0];
		const ry = farCorner[1] - nearCorner[1];
		const rz = farCorner[2] - nearCorner[2];
		farCorner[0] = nearCorner[0] + rx * farSplit;
		farCorner[1] = nearCorner[1] + ry * farSplit;
		farCorner[2] = nearCorner[2] + rz * farSplit;
		nearCorner[0] = nearCorner[0] + rx * nearSplit;
		nearCorner[1] = nearCorner[1] + ry * nearSplit;
		nearCorner[2] = nearCorner[2] + rz * nearSplit;
	}
}
/** Fit every cascade to its slice of the camera frustum. `radiusScale` (stabilized cascades only, default 1) widens
*  each cascade's bounding sphere by that factor before the 1/16 rounding, so the fitted map keeps covering its
*  slice while the camera moves a little (the static cache's opt-in camera-coverage refit). */
function _computeCsmCascades(scene, camera, light, cfg, casterMeshes, scratch, radiusScale = 1) {
	const near = camera.nearPlane;
	const far = camera.farPlane;
	const cameraRange = far - near;
	const shadowMaxZ = cfg._shadowMaxZ ?? far;
	const maxDistance = shadowMaxZ < far && shadowMaxZ >= near ? Math.min((shadowMaxZ - near) / (far - near), 1) : 1;
	const minZ = near + 0 * cameraRange;
	const maxZ = near + maxDistance * cameraRange;
	const range = maxZ - minZ;
	const ratio = maxZ / minZ;
	const n = cfg._numCascades;
	const cascades = scratch._cascades;
	const corners = scratch._corners;
	const viewFrustumZ = cascades._viewFrustumZ;
	const frustumLengths = cascades._frustumLengths;
	for (let i = 0; i < n; i++) {
		const p = (i + 1) / n;
		const log = minZ * ratio ** p;
		const uniform = minZ + range * p;
		const d = cfg._lambda * (log - uniform) + uniform;
		frustumLengths[i] = d - (i === 0 ? minZ : viewFrustumZ[i - 1]);
		viewFrustumZ[i] = d;
	}
	const lightWorld = light.worldMatrix;
	const direction = light.direction;
	let dx = lightWorld[0] * direction.x + lightWorld[4] * direction.y + lightWorld[8] * direction.z;
	let dy = lightWorld[1] * direction.x + lightWorld[5] * direction.y + lightWorld[9] * direction.z;
	let dz = lightWorld[2] * direction.x + lightWorld[6] * direction.y + lightWorld[10] * direction.z;
	const dl = Math.hypot(dx, dy, dz) || 1;
	dx /= dl;
	dy /= dl;
	dz /= dl;
	if (Math.abs(dy) >= 1) dz = 1e-13;
	const aspect = csmCameraAspect(scene, camera);
	const vp = getViewProjectionMatrix(camera, aspect);
	const invViewProj = scratch._invViewProj;
	invertMat4ToRefOrIdentity(vp, invViewProj);
	const hasCasterBounds = _castersWorldAabbInto(casterMeshes, scratch);
	let prevSplit = 0;
	for (let c = 0; c < n; c++) {
		const split = prevSplit + frustumLengths[c] / cameraRange;
		_csmSliceCornersInto(corners, invViewProj, prevSplit, split);
		prevSplit = split;
		let cx = 0, cy = 0, cz = 0;
		for (const corner of corners) {
			cx += corner[0];
			cy += corner[1];
			cz += corner[2];
		}
		cx /= 8;
		cy /= 8;
		cz /= 8;
		let minX, maxX, minY, maxY, minEz, maxEz;
		let stableRadius = 0;
		const viewBuf = scratch._view;
		if (cfg._stabilizeCascades) {
			let radius = 0;
			for (const corner of corners) radius = Math.max(radius, Math.hypot(corner[0] - cx, corner[1] - cy, corner[2] - cz));
			radius = Math.ceil(radius * radiusScale * 16) / 16;
			stableRadius = radius;
			minX = minY = minEz = -radius;
			maxX = maxY = maxEz = radius;
		} else {
			buildLightViewMatrixInto(viewBuf, dx, dy, dz, cx, cy, cz);
			minX = minY = minEz = Infinity;
			maxX = maxY = maxEz = -Infinity;
			for (const corner of corners) {
				transformCoordInto(corner, viewBuf, corner[0], corner[1], corner[2]);
				minX = Math.min(minX, corner[0]);
				maxX = Math.max(maxX, corner[0]);
				minY = Math.min(minY, corner[1]);
				maxY = Math.max(maxY, corner[1]);
				minEz = Math.min(minEz, corner[2]);
				maxEz = Math.max(maxEz, corner[2]);
			}
		}
		const eyeX = cx + dx * minEz;
		const eyeY = cy + dy * minEz;
		const eyeZ = cz + dz * minEz;
		const view = cascades._views[c];
		buildLightViewMatrixInto(view, dx, dy, dz, eyeX, eyeY, eyeZ);
		let viewMinZ = 0;
		let viewMaxZ = maxEz - minEz;
		if (hasCasterBounds) {
			const aabb = scratch._aabb;
			let cMinZ = Infinity;
			let cMaxZ = -Infinity;
			for (let k = 0; k < 8; k++) {
				const wx = aabb[k & 1 ? 3 : 0];
				const wy = aabb[k & 2 ? 4 : 1];
				const wz = aabb[k & 4 ? 5 : 2];
				const lz = view[2] * wx + view[6] * wy + view[10] * wz + view[14];
				cMinZ = Math.min(cMinZ, lz);
				cMaxZ = Math.max(cMaxZ, lz);
			}
			if (cMinZ <= viewMaxZ) {
				viewMinZ = Math.min(viewMinZ, cMinZ);
				viewMaxZ = Math.min(viewMaxZ, cMaxZ);
			}
		}
		if (cfg._worldSpaceBias) viewMaxZ += cfg._worldSpaceBias;
		const transform = cascades._transforms[c];
		orthoViewInto(transform, view, minX, maxX, minY, maxY, viewMinZ, viewMaxZ);
		let aClipX = transform[12];
		let aClipY = transform[13];
		if (cfg._stabilizeCascades && stableRadius > 0) {
			const texelWorld = 2 * stableRadius / cfg._mapSize;
			const anchorX = Math.round((view[0] * cx + view[4] * cy + view[8] * cz) / texelWorld) * texelWorld;
			const anchorY = Math.round((view[1] * cx + view[5] * cy + view[9] * cz) / texelWorld) * texelWorld;
			aClipX += anchorX / stableRadius;
			aClipY += anchorY / stableRadius;
		}
		const ox = aClipX * (cfg._mapSize / 2);
		const oy = aClipY * (cfg._mapSize / 2);
		const offX = (Math.round(ox) - ox) * (2 / cfg._mapSize);
		const offY = (Math.round(oy) - oy) * (2 / cfg._mapSize);
		transform[12] = transform[12] + offX;
		transform[13] = transform[13] + offY;
		cascades._near[c] = viewMinZ;
		cascades._far[c] = viewMaxZ;
	}
	return cascades;
}
/** Write the casters' world AABB into scratch-owned storage. */
function _castersWorldAabbInto(casterMeshes, scratch) {
	const aabb = scratch._aabb;
	let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
	for (const mesh of casterMeshes) {
		const ti = mesh.thinInstances;
		if (ti && ti.count > 0 && ti.matrices) {
			const cached = _thinInstanceWorldAabb(mesh, ti);
			if (cached) {
				const bounds = cached._bounds;
				minX = Math.min(minX, bounds[0]);
				minY = Math.min(minY, bounds[1]);
				minZ = Math.min(minZ, bounds[2]);
				maxX = Math.max(maxX, bounds[3]);
				maxY = Math.max(maxY, bounds[4]);
				maxZ = Math.max(maxZ, bounds[5]);
			}
			continue;
		}
		const world = mesh.worldMatrix;
		const bmin = mesh.boundMin ?? DEFAULT_BOUND_MIN;
		const bmax = mesh.boundMax ?? DEFAULT_BOUND_MAX;
		for (let k = 0; k < 8; k++) {
			const lx = k & 1 ? bmax[0] : bmin[0];
			const ly = k & 2 ? bmax[1] : bmin[1];
			const lz = k & 4 ? bmax[2] : bmin[2];
			const wx = world[0] * lx + world[4] * ly + world[8] * lz + world[12];
			const wy = world[1] * lx + world[5] * ly + world[9] * lz + world[13];
			const wz = world[2] * lx + world[6] * ly + world[10] * lz + world[14];
			minX = Math.min(minX, wx);
			minY = Math.min(minY, wy);
			minZ = Math.min(minZ, wz);
			maxX = Math.max(maxX, wx);
			maxY = Math.max(maxY, wy);
			maxZ = Math.max(maxZ, wz);
		}
	}
	if (!Number.isFinite(minX)) return false;
	aabb[0] = minX;
	aabb[1] = minY;
	aabb[2] = minZ;
	aabb[3] = maxX;
	aabb[4] = maxY;
	aabb[5] = maxZ;
	return true;
}
/** Per-mesh cache of a thin-instanced caster's world AABB.
*  Lazily allocated so this module keeps zero import-time side effects and stays tree-shakable. */
var _thinCasterAabbCache = null;
function _getThinCasterAabbCache() {
	if (!_thinCasterAabbCache) _thinCasterAabbCache = /* @__PURE__ */ new WeakMap();
	return _thinCasterAabbCache;
}
/** Compute a thin-instanced caster's world AABB in a stable cache entry. */
function _thinInstanceWorldAabb(mesh, ti) {
	const cache = _getThinCasterAabbCache();
	const worldVersion = mesh.worldMatrixVersion;
	let entry = cache.get(mesh);
	if (entry && entry._version === ti._version && entry._worldVersion === worldVersion) return Number.isFinite(entry._bounds[0]) ? entry : null;
	if (!entry) {
		entry = {
			_version: 0,
			_worldVersion: 0,
			_bounds: [
				0,
				0,
				0,
				0,
				0,
				0
			]
		};
		cache.set(mesh, entry);
	}
	const world = mesh.worldMatrix;
	const bmin = mesh.boundMin ?? DEFAULT_BOUND_MIN;
	const bmax = mesh.boundMax ?? DEFAULT_BOUND_MAX;
	const mats = ti.matrices;
	const count = Math.min(ti.count, mats.length / 16 | 0);
	let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
	for (let i = 0; i < count; i++) {
		const o = i * 16;
		if (Math.abs(mats[o]) + Math.abs(mats[o + 1]) + Math.abs(mats[o + 2]) + Math.abs(mats[o + 4]) + Math.abs(mats[o + 5]) + Math.abs(mats[o + 6]) + Math.abs(mats[o + 8]) + Math.abs(mats[o + 9]) + Math.abs(mats[o + 10]) < 1e-9) continue;
		for (let k = 0; k < 8; k++) {
			const lx = k & 1 ? bmax[0] : bmin[0];
			const ly = k & 2 ? bmax[1] : bmin[1];
			const lz = k & 4 ? bmax[2] : bmin[2];
			const ix = mats[o] * lx + mats[o + 4] * ly + mats[o + 8] * lz + mats[o + 12];
			const iy = mats[o + 1] * lx + mats[o + 5] * ly + mats[o + 9] * lz + mats[o + 13];
			const iz = mats[o + 2] * lx + mats[o + 6] * ly + mats[o + 10] * lz + mats[o + 14];
			const wx = world[0] * ix + world[4] * iy + world[8] * iz + world[12];
			const wy = world[1] * ix + world[5] * iy + world[9] * iz + world[13];
			const wz = world[2] * ix + world[6] * iy + world[10] * iz + world[14];
			minX = Math.min(minX, wx);
			minY = Math.min(minY, wy);
			minZ = Math.min(minZ, wz);
			maxX = Math.max(maxX, wx);
			maxY = Math.max(maxY, wy);
			maxZ = Math.max(maxZ, wz);
		}
	}
	entry._version = ti._version;
	entry._worldVersion = worldVersion;
	const bounds = entry._bounds;
	if (!Number.isFinite(minX)) {
		bounds[0] = Infinity;
		return null;
	}
	bounds[0] = minX;
	bounds[1] = minY;
	bounds[2] = minZ;
	bounds[3] = maxX;
	bounds[4] = maxY;
	bounds[5] = maxZ;
	return entry;
}
function _writeCsmUbo(out, cascades, cfg) {
	out.fill(0);
	const n = cascades._transforms.length;
	for (let i = 0; i < n; i++) out.set(cascades._transforms[i], i * 16);
	for (let i = 0; i < n; i++) {
		out[64 + i] = cascades._viewFrustumZ[i];
		out[68 + i] = cascades._frustumLengths[i];
	}
	out[72] = cfg._darkness;
	out[73] = cfg._mapSize;
	out[74] = 1 / cfg._mapSize;
	out[75] = cfg._frustumEdgeFalloff;
	out[76] = n;
	out[77] = cfg._cascadeBlendPercentage === 0 ? 1e4 : 1 / cfg._cascadeBlendPercentage;
}
/** @internal Convert a physical caster offset to the clip-space Z offset for one orthographic cascade. */
function csmWorldBiasClipOffset(worldSpaceBias, near, far) {
	const range = far - near;
	if (!Number.isFinite(worldSpaceBias) || worldSpaceBias <= 0 || !Number.isFinite(range) || range <= 0) return 0;
	return worldSpaceBias / range;
}
/** @internal Apply clip-space Z bias to a view-projection matrix. */
function _biasViewProjection(matrix, clipOffset) {
	matrix[14] = matrix[14] + clipOffset;
}
export { _biasViewProjection, _computeCsmCascades, _createCascadeScratch, _csmSliceCornersInto, _dropTaskMeshes, _reconcileCsmCasters, _writeCsmUbo, buildLightViewMatrixInto, csmCameraAspect, csmWorldBiasClipOffset, ensureCsmShadowTaskState, preloadCsmShadowTaskState, renderCsmShadowMap };

//# sourceMappingURL=csm-shadow-task-hooks.js.map