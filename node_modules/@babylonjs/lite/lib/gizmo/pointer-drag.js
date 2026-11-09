import { getCameraPosition, getViewProjectionMatrix } from "../camera/camera.js";
import { createPickingRay } from "../picking/ray.js";
import { resolveCameraViewport } from "../camera/viewport.js";
import { GizmoObservable } from "./gizmo-core.js";
import { normalizeVec3Obj, rayPlaneIntersect } from "./gizmo-math.js";
import { createGpuPicker, disposePicker, pickAsync } from "../picking/gpu-picker.js";
// src/gizmo/pointer-drag.ts
/** Build a PointerDrag descriptor.  The drag is inert until `registerPointerDrag`
*  is called against a utility layer with collider meshes assigned to it. */
function createPointerDrag(options) {
	return {
		options: {
			moveAttached: false,
			...options
		},
		enabled: true,
		_colliders: [],
		onDragStart: new GizmoObservable(),
		onDrag: new GizmoObservable(),
		onDragEnd: new GizmoObservable(),
		onHoverStart: new GizmoObservable(),
		onHoverEnd: new GizmoObservable(),
		dragging: false,
		hovering: false
	};
}
var _dispatchers = null;
function getDispatchers() {
	if (!_dispatchers) _dispatchers = /* @__PURE__ */ new WeakMap();
	return _dispatchers;
}
/** Register the drag's colliders + handlers with the per-canvas dispatcher for
*  this utility layer.  Returns a function that unregisters the drag.  When the
*  last drag for a canvas is unregistered, the dispatcher tears itself down
*  (canvas listeners are detached, the GPU picker is disposed, the cache entry
*  is removed) so disposing all gizmos doesn't leak listeners or GPU resources. */
function registerPointerDrag(layer, canvas, drag) {
	const map = getDispatchers();
	let state = map.get(canvas);
	if (!state) {
		state = installDispatcher(layer, canvas);
		map.set(canvas, state);
	} else if (state.layer !== layer) console.warn("[babylon-lite] registerPointerDrag: a second UtilityLayer was used for the same canvas. Only one utility layer per canvas is supported; the first layer's GPU picker will be reused.");
	state.drags.push(drag);
	return () => {
		const i = state.drags.indexOf(drag);
		if (i < 0) return;
		state.drags.splice(i, 1);
		if (state.active && state.active.drag === drag) {
			const { lastPlanePoint, pointerId } = state.active;
			state.active = null;
			state.pickPending = false;
			drag.dragging = false;
			drag.onDragEnd.notify({
				dragPlanePoint: lastPlanePoint,
				pointerId,
				pointerEvent: null
			});
			if ("releasePointerCapture" in state.canvas) try {
				state.canvas.releasePointerCapture(pointerId);
			} catch {}
		}
		if (state.hovered === drag) {
			drag.hovering = false;
			drag.onHoverEnd.notify();
			state.hovered = null;
		}
		if (state.drags.length === 0 && !state.active) {
			state.hoverToken++;
			state.cleanup();
			disposePicker(state.picker);
			map.delete(canvas);
		}
	};
}
function installDispatcher(layer, canvas) {
	const state = {
		layer,
		canvas,
		picker: createGpuPicker(layer.scene),
		drags: [],
		active: null,
		hovered: null,
		hoverToken: 0,
		pickPending: false,
		cleanup: () => void 0
	};
	const onPointerDown = (event) => {
		if (state.active || event.button !== 0) return;
		state.pickPending = true;
		handlePointerDown(state, event);
	};
	const onPointerMove = (event) => {
		if (state.active && event.pointerId === state.active.pointerId) {
			handlePointerMove(state, event);
			return;
		}
		handleHoverMove(state, event);
	};
	const onPointerUp = (event) => {
		if (!state.active || event.pointerId !== state.active.pointerId) return;
		handlePointerUp(state, event);
	};
	const onPointerLeave = () => {
		if (state.hovered) {
			state.hovered.hovering = false;
			state.hovered.onHoverEnd.notify();
			state.hovered = null;
		}
	};
	canvas.addEventListener("pointerdown", onPointerDown, { capture: true });
	canvas.addEventListener("pointermove", onPointerMove, { capture: true });
	canvas.addEventListener("pointerup", onPointerUp, { capture: true });
	canvas.addEventListener("pointercancel", onPointerUp, { capture: true });
	canvas.addEventListener("pointerleave", onPointerLeave, { capture: true });
	state.cleanup = () => {
		canvas.removeEventListener("pointerdown", onPointerDown, { capture: true });
		canvas.removeEventListener("pointermove", onPointerMove, { capture: true });
		canvas.removeEventListener("pointerup", onPointerUp, { capture: true });
		canvas.removeEventListener("pointercancel", onPointerUp, { capture: true });
		canvas.removeEventListener("pointerleave", onPointerLeave, { capture: true });
	};
	return state;
}
/** Perform a single hover pick and update hover state.  `pickAsync` serializes
*  per-picker, so concurrent calls (a fast pointer, or a pointer-down racing an
*  in-flight hover) never race the picker's shared 1×1 staging buffers.
*
*  Display-only gizmos (every registered drag disabled) do ZERO hover picking —
*  no GPU work is spent when nothing is interactive.  This is what makes
*  `drag.enabled = false` (BJS `PointerDragBehavior.enabled` /
*  `AxisDragGizmo.isEnabled = false`) fully non-interactive.  We still fall
*  through to the hover-transition logic so a gizmo hovered just before it was
*  disabled clears its hover material instead of staying stuck. */
async function handleHoverMove(state, event) {
	let next = null;
	if (state.drags.some((d) => d.enabled)) {
		const token = ++state.hoverToken;
		const info = await pickAsync(state.picker, event.offsetX, event.offsetY);
		if (token !== state.hoverToken || state.active) return;
		const drag = info.hit && info.pickedMesh ? findDragForMesh(state.drags, info.pickedMesh) : null;
		next = drag && drag.enabled ? drag : null;
	}
	if (next === state.hovered) return;
	if (state.hovered) {
		state.hovered.hovering = false;
		state.hovered.onHoverEnd.notify();
	}
	state.hovered = next;
	if (next) {
		next.hovering = true;
		next.onHoverStart.notify();
	}
}
async function handlePointerDown(state, event) {
	let info;
	try {
		info = await pickAsync(state.picker, event.offsetX, event.offsetY);
	} finally {
		state.pickPending = false;
	}
	if (!info.hit || !info.pickedMesh) return;
	const drag = findDragForMesh(state.drags, info.pickedMesh);
	if (!drag || !drag.enabled) return;
	if ("setPointerCapture" in state.canvas) try {
		state.canvas.setPointerCapture(event.pointerId);
	} catch {}
	const hitPoint = info.pickedPoint ? {
		x: info.pickedPoint[0],
		y: info.pickedPoint[1],
		z: info.pickedPoint[2]
	} : null;
	const planeNormal = pickDragPlaneNormal(drag, state.layer.scene, hitPoint);
	const downRay = canvasRayFromPointer(state.layer.scene, state.canvas, event.offsetX, event.offsetY);
	info.ray = downRay?.ray ?? null;
	const overridePoint = drag.options.getPlanePoint?.();
	const planePoint = overridePoint ?? hitPoint ?? {
		x: 0,
		y: 0,
		z: 0
	};
	let startPoint = hitPoint ?? planePoint;
	if (overridePoint) startPoint = (downRay ? rayPlaneIntersect(downRay.origin, downRay.dir, planePoint, planeNormal) : null) ?? planePoint;
	if (state.hovered) {
		state.hovered.hovering = false;
		state.hovered.onHoverEnd.notify();
		state.hovered = null;
	}
	state.active = {
		drag,
		planeNormal,
		planePoint: {
			x: planePoint.x,
			y: planePoint.y,
			z: planePoint.z
		},
		lastPlanePoint: {
			x: startPoint.x,
			y: startPoint.y,
			z: startPoint.z
		},
		startPlanePoint: {
			x: startPoint.x,
			y: startPoint.y,
			z: startPoint.z
		},
		pointerId: event.pointerId
	};
	drag.dragging = true;
	drag.onDragStart.notify({
		dragPlanePoint: startPoint,
		dragPlaneNormal: planeNormal,
		pickInfo: info,
		pointerId: event.pointerId,
		pointerEvent: event
	});
}
function handlePointerMove(state, event) {
	const active = state.active;
	const ray = canvasRayFromPointer(state.layer.scene, state.canvas, event.offsetX, event.offsetY);
	if (!ray) return;
	const hit = rayPlaneIntersect(ray.origin, ray.dir, active.planePoint, active.planeNormal);
	if (!hit) return;
	let delta = {
		x: hit.x - active.lastPlanePoint.x,
		y: hit.y - active.lastPlanePoint.y,
		z: hit.z - active.lastPlanePoint.z
	};
	let dragDistance;
	const axis = active.drag.options.dragAxis;
	if (axis) {
		const proj = delta.x * axis.x + delta.y * axis.y + delta.z * axis.z;
		delta = {
			x: axis.x * proj,
			y: axis.y * proj,
			z: axis.z * proj
		};
		const totalDelta = {
			x: hit.x - active.startPlanePoint.x,
			y: hit.y - active.startPlanePoint.y,
			z: hit.z - active.startPlanePoint.z
		};
		dragDistance = totalDelta.x * axis.x + totalDelta.y * axis.y + totalDelta.z * axis.z;
	} else dragDistance = Math.hypot(delta.x, delta.y, delta.z);
	if (active.drag.options.updateDragPlane !== false) {
		const configuredPlaneNormal = active.drag.options.dragPlaneNormal;
		active.planeNormal = configuredPlaneNormal ? normalizeVec3Obj(configuredPlaneNormal) : pickDragPlaneNormal(active.drag, state.layer.scene, hit);
		const livePlanePoint = active.drag.options.getPlanePoint?.();
		if (livePlanePoint) active.planePoint = {
			x: livePlanePoint.x,
			y: livePlanePoint.y,
			z: livePlanePoint.z
		};
	}
	active.drag.onDrag.notify({
		delta,
		dragPlanePoint: hit,
		dragDistance,
		dragPlaneNormal: active.planeNormal,
		pointerId: event.pointerId
	});
	active.lastPlanePoint = {
		x: hit.x,
		y: hit.y,
		z: hit.z
	};
}
function handlePointerUp(state, event) {
	const active = state.active;
	state.active = null;
	active.drag.dragging = false;
	active.drag.onDragEnd.notify({
		dragPlanePoint: active.lastPlanePoint,
		pointerId: event.pointerId,
		pointerEvent: event
	});
	if ("releasePointerCapture" in state.canvas) try {
		state.canvas.releasePointerCapture(event.pointerId);
	} catch {}
}
function findDragForMesh(drags, mesh) {
	for (const d of drags) if (d._colliders.includes(mesh)) return d;
	return null;
}
/** Returns true when the gizmo dispatcher for `canvas` currently has a pointer
*  hovering one of its colliders or an active drag in progress.  Camera
*  controls consult this on pointer-down so orbiting doesn't start when the
*  press lands on (or drags) a gizmo. */
function isGizmoInteracting(canvas) {
	const state = _dispatchers?.get(canvas);
	if (!state) return false;
	return state.hovered !== null || state.active !== null;
}
/** Returns true when the gizmo dispatcher for `canvas` has an ACTIVE drag in
*  progress (a collider was pressed and is being dragged).  Unlike
*  {@link isGizmoInteracting} this ignores mere hover, so camera controls can
*  abort an optimistically-started orbit once a gizmo drag (recognised a frame
*  after pointer-down, since picking is async) reclaims the gesture — without
*  aborting a legitimate orbit when the cursor merely passes over a gizmo. */
function isGizmoDragging(canvas) {
	const state = _dispatchers?.get(canvas);
	return state ? state.active !== null : false;
}
/** Returns true while the gizmo dispatcher for `canvas` has a pointer-down GPU
*  pick still in flight.  Camera controls consult this to DEFER (not yet apply)
*  an orbit until the pick resolves, so a press that lands on a gizmo never
*  produces a stray orbit even if the async pick is slow. */
function isGizmoPickPending(canvas) {
	const state = _dispatchers?.get(canvas);
	return state ? state.pickPending : false;
}
/** Compute the world-space plane normal used for a drag.  For plane mode it's
*  the configured `dragPlaneNormal`.  For axis mode it's the plane that
*  contains `dragAxis` and faces the camera most directly. */
function pickDragPlaneNormal(drag, scene, hitPoint) {
	const planeNormal = drag.options.dragPlaneNormal;
	if (planeNormal) return normalizeVec3Obj(planeNormal);
	const axis = drag.options.dragAxis;
	const cam = scene.camera;
	if (!cam) return normalizeVec3Obj({
		x: -axis.y,
		y: axis.x,
		z: 0
	});
	const camPos = getCameraPosition(cam);
	const ref = hitPoint ?? {
		x: 0,
		y: 0,
		z: 0
	};
	const dx = camPos.x - ref.x, dy = camPos.y - ref.y, dz = camPos.z - ref.z;
	const dotAxis = dx * axis.x + dy * axis.y + dz * axis.z;
	let nx = dx - axis.x * dotAxis;
	let ny = dy - axis.y * dotAxis;
	let nz = dz - axis.z * dotAxis;
	const len = Math.hypot(nx, ny, nz);
	if (len < 1e-6) return normalizeVec3Obj({
		x: -axis.y,
		y: axis.x,
		z: 0
	});
	nx /= len;
	ny /= len;
	nz /= len;
	return {
		x: nx,
		y: ny,
		z: nz
	};
}
/** Build a world-space ray from CSS canvas coordinates against the scene camera. */
function canvasRayFromPointer(scene, canvas, cssX, cssY) {
	const cam = scene.camera;
	if (!cam) return null;
	const backingWidth = canvas.width;
	const backingHeight = canvas.height;
	const clientWidth = canvas.clientWidth || backingWidth;
	const clientHeight = canvas.clientHeight || backingHeight;
	const viewport = resolveCameraViewport(cam, backingWidth, backingHeight);
	const scaleX = backingWidth / clientWidth;
	const scaleY = backingHeight / clientHeight;
	const px = cssX * scaleX - viewport.x;
	const py = cssY * scaleY - viewport.y;
	const w = viewport.width;
	const h = viewport.height;
	if (w === 0 || h === 0) return null;
	const aspect = w / h;
	const vp = getViewProjectionMatrix(cam, aspect);
	const ray = createPickingRay(px, py, vp, w, h);
	if (!ray) return null;
	return {
		origin: {
			x: ray.origin[0],
			y: ray.origin[1],
			z: ray.origin[2]
		},
		dir: {
			x: ray.direction[0],
			y: ray.direction[1],
			z: ray.direction[2]
		},
		ray
	};
}
export { createPointerDrag, isGizmoDragging, isGizmoInteracting, isGizmoPickPending, registerPointerDrag };

//# sourceMappingURL=pointer-drag.js.map