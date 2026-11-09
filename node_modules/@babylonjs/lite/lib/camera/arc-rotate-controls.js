import { _rightHanded } from "#coordinate-system";
// src/camera/arc-rotate-controls.ts
var _arcRotateKeyboardFactory;
/** @internal Install the optional arc-rotate keyboard input factory. */
function _installArcRotateKeyboardControls(factory) {
	_arcRotateKeyboardFactory = factory;
}
/**
* Clamp a camera's alpha/beta/radius into its configured limits in place, zeroing
* the matching inertial offset when a bound is hit so momentum can't keep driving
* into the wall (the source of the overshoot-then-snap "jiggle"). A bound only
* applies when it is explicitly set, so limit-free cameras are left untouched.
*/
function clampCameraToLimits(camera) {
	if (camera.lowerRadiusLimit !== void 0 && camera.radius < camera.lowerRadiusLimit) {
		camera.radius = camera.lowerRadiusLimit;
		camera.inertialRadiusOffset = 0;
	} else if (camera.upperRadiusLimit !== void 0 && camera.radius > camera.upperRadiusLimit) {
		camera.radius = camera.upperRadiusLimit;
		camera.inertialRadiusOffset = 0;
	}
	if (camera.lowerBetaLimit !== void 0 && camera.beta < camera.lowerBetaLimit) {
		camera.beta = camera.lowerBetaLimit;
		camera.inertialBetaOffset = 0;
	} else if (camera.upperBetaLimit !== void 0 && camera.beta > camera.upperBetaLimit) {
		camera.beta = camera.upperBetaLimit;
		camera.inertialBetaOffset = 0;
	}
	if (camera.lowerAlphaLimit !== void 0 && camera.alpha < camera.lowerAlphaLimit) {
		camera.alpha = camera.lowerAlphaLimit;
		camera.inertialAlphaOffset = 0;
	} else if (camera.upperAlphaLimit !== void 0 && camera.alpha > camera.upperAlphaLimit) {
		camera.alpha = camera.upperAlphaLimit;
		camera.inertialAlphaOffset = 0;
	}
}
/**
* Configure orbit/zoom limits on an ArcRotateCamera. This is fully opt-in and
* self-contained: cameras that never call it pay zero cost and bundle no clamping
* code (the camera's scalar setters call an undefined hook).
*
* What it does:
*  1. Stores the provided bounds on the camera and clamps the current pose into
*     range right away (inertia zeroed), so enabling limits never causes a jump.
*  2. Installs a self-clamp hook on the camera (`_clampToLimits`). The
*     alpha/beta/radius setters invoke it on every mutation, so any caller —
*     pinch direct-write, inertial overshoot, auto-rotate — is snapped back to
*     the wall in the same statement that pushed past it. The camera is therefore
*     never observably out of bounds at any point a per-frame callback reads it
*     (e.g. a camera-pinned skybox), eliminating both the overshoot-then-snap
*     jiggle and the one-frame clip "blink" of a deferred per-frame clamp.
*
* Only the fields present on `limits` are written, so calls compose; pass a field
* as `undefined` to remove that bound. Returns a disposer that removes the
* self-clamp hook.
*
* The optional `scene` parameter is accepted for backward compatibility and is
* unused — enforcement no longer needs a per-frame scene hook.
*/
function setCameraLimits(camera, limits, scene) {
	if ("lowerAlphaLimit" in limits) camera.lowerAlphaLimit = limits.lowerAlphaLimit;
	if ("upperAlphaLimit" in limits) camera.upperAlphaLimit = limits.upperAlphaLimit;
	if ("lowerBetaLimit" in limits) camera.lowerBetaLimit = limits.lowerBetaLimit;
	if ("upperBetaLimit" in limits) camera.upperBetaLimit = limits.upperBetaLimit;
	if ("lowerRadiusLimit" in limits) camera.lowerRadiusLimit = limits.lowerRadiusLimit;
	if ("upperRadiusLimit" in limits) camera.upperRadiusLimit = limits.upperRadiusLimit;
	const enforce = () => clampCameraToLimits(camera);
	camera._clampToLimits = enforce;
	enforce();
	return () => {
		if (camera._clampToLimits === enforce) camera._clampToLimits = void 0;
	};
}
/**
* Attach orbit/zoom/pan controls to an ArcRotateCamera.
* Matches Babylon.js ArcRotateCameraPointersInput behavior with inertia:
* - Primary-button drag: rotate (alpha/beta) with momentum by default
* - Secondary-button drag: pan (shift target) with momentum by default
* - Wheel: zoom (radius) with momentum
* - Pinch: zoom (touch, direct — no inertia)
*
* Mouse and pen button actions can be configured independently through
* {@link AttachControlOptions.pointerMappings}. Touch and wheel behavior are
* fixed so remapping desktop pointer buttons cannot alter mobile gestures.
* Keyboard input is a separate opt-in installed by
* {@link enableArcRotateKeyboardControls}; mappings and sensitivities are
* configured through {@link AttachControlOptions.keyboard}.
*
* Input handlers accumulate into the camera's inertial offset properties.
* Inertia is applied each frame via scene._beforeRender (the engine's render
* loop); a scene is required for inertia, there is no standalone rAF fallback.
*
* Orbit/zoom limits are entirely opt-in via {@link setCameraLimits}; the camera
* self-clamps in its setters, so this loop carries no limit code.
*
* Camera stays plain data — this function reads/writes its properties.
*
* ### Lifecycle / cleanup (important)
*
* The returned function detaches everything this call attached: it removes the
* canvas DOM listeners (pointer/wheel/contextmenu/touch/gesture plus any
* listeners owned by installed input modules) and, when a `scene` was supplied,
* removes its `_beforeRender` inertia hook. It is idempotent — calling
* it more than once is safe (the hook is removed only if still present, and
* removing a DOM listener twice is a no-op).
*
* The controls are **not** automatically tied to the scene's lifetime. Passing a
* `scene` only enables inertia (it registers the per-frame hook); it does **not**
* register this cleanup for scene disposal. Because the DOM listeners live on the
* `canvas` rather than on the scene, {@link disposeScene} clears scene-owned state
* (including `_beforeRender`) but does **not** remove the canvas listeners added
* here. The caller owns the controls' lifetime and must detach them explicitly:
*
* ```ts
* const detachCameraControl = attachControl(camera, canvas, scene);
* // Later — detach controls yourself before/after disposing the scene:
* detachCameraControl();
* disposeScene(scene);
* ```
*
* To tie the controls to the scene so `disposeScene(scene)` also detaches them,
* register the returned cleanup with {@link onSceneDispose}:
*
* ```ts
* onSceneDispose(scene, attachControl(camera, canvas, scene));
* // Now disposeScene(scene) removes the canvas listeners too.
* ```
*
* @returns A cleanup function that removes all canvas listeners and the
* `_beforeRender` inertia hook. Safe to call multiple times.
*/
function attachControl(camera, canvas, scene, options) {
	const ROTATION_EPSILON = .001;
	const RADIUS_EPSILON = .001;
	const PANNING_EPSILON = 1e-4;
	const decayInertia = (offset, factor, epsilon) => Math.abs(offset *= factor) < epsilon ? 0 : offset;
	let isDragging = false;
	let isPanning = false;
	let lastX = 0;
	let lastY = 0;
	const keyboardAttachment = _arcRotateKeyboardFactory?.(camera, canvas, options?.keyboard);
	const activeTouches = /* @__PURE__ */ new Map();
	let pinchStartDist = 0;
	let pinchStartRadius = 0;
	function onPointerDown(e) {
		if (options?.shouldHandlePointerDown && !options.shouldHandlePointerDown(e)) return;
		canvas.setPointerCapture(e.pointerId);
		lastX = e.clientX;
		lastY = e.clientY;
		const pointerAction = e.button === 0 ? e.pointerType === "touch" ? "rotate" : options?.pointerMappings?.primaryButton ?? "rotate" : e.button === 2 ? options?.pointerMappings?.secondaryButton ?? "pan" : void 0;
		if (pointerAction) {
			isDragging = pointerAction === "rotate";
			isPanning = !isDragging;
		}
	}
	function onPointerMove(e) {
		const dx = e.clientX - lastX;
		const dy = e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
		if (activeTouches.size >= 2) return;
		if (!isDragging && !isPanning) return;
		if (options?.isExternalDragActive?.()) {
			isDragging = false;
			isPanning = false;
			camera.inertialAlphaOffset = 0;
			camera.inertialBetaOffset = 0;
			camera.inertialPanningX = 0;
			camera.inertialPanningY = 0;
			return;
		}
		if (options?.isExternalPickPending?.()) return;
		if (isDragging) {
			const angularSensibility = camera.angularSensibility;
			camera.inertialAlphaOffset -= dx / angularSensibility;
			camera.inertialBetaOffset -= dy / angularSensibility;
		}
		if (isPanning) {
			const panningSensibility = camera.panningSensibility;
			camera.inertialPanningX += -dx / panningSensibility;
			camera.inertialPanningY += dy / panningSensibility;
		}
	}
	function onPointerUp(e) {
		canvas.releasePointerCapture(e.pointerId);
		isDragging = false;
		isPanning = false;
	}
	function onWheel(e) {
		e.preventDefault();
		camera.inertialRadiusOffset -= e.deltaY * camera.radius / (camera.wheelPrecision * 1e3);
	}
	/** Record the changed touches; returns true while two or more fingers are down. */
	function trackTouches(e) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			activeTouches.set(touch.identifier, {
				x: touch.clientX,
				y: touch.clientY
			});
		}
		return activeTouches.size >= 2;
	}
	/** Distance between the first two active touches. */
	function pinchDistance() {
		const iter = activeTouches.values();
		const p0 = iter.next().value;
		const p1 = iter.next().value;
		return Math.hypot(p1.x - p0.x, p1.y - p0.y);
	}
	function onTouchStart(e) {
		if (trackTouches(e)) {
			isDragging = false;
			isPanning = false;
			pinchStartDist = pinchDistance();
			pinchStartRadius = camera.radius;
			e.preventDefault();
		}
	}
	function onTouchMove(e) {
		if (trackTouches(e)) {
			e.preventDefault();
			const dist = pinchDistance();
			if (pinchStartDist > 0 && dist > 0) {
				camera.radius = pinchStartRadius * (pinchStartDist / dist);
				camera.radius = Math.max(.01, camera.radius);
			}
		}
	}
	function onTouchEnd(e) {
		for (let i = 0; i < e.changedTouches.length; i++) activeTouches.delete(e.changedTouches[i].identifier);
		if (activeTouches.size === 1) {
			const p = activeTouches.values().next().value;
			lastX = p.x;
			lastY = p.y;
		}
		if (activeTouches.size < 2) pinchStartDist = 0;
	}
	function preventDefault(e) {
		e.preventDefault();
	}
	/** Per-frame: apply inertial offsets to camera properties and decay them. */
	function applyInertia() {
		keyboardAttachment?.[0]();
		if (camera.inertialAlphaOffset !== 0 || camera.inertialBetaOffset !== 0) {
			camera.alpha += _rightHanded ? -camera.inertialAlphaOffset : camera.inertialAlphaOffset;
			camera.beta += camera.inertialBetaOffset;
			const eps = .01;
			camera.beta = Math.max(eps, Math.min(Math.PI - eps, camera.beta));
			camera.inertialAlphaOffset = decayInertia(camera.inertialAlphaOffset, camera.inertia, ROTATION_EPSILON);
			camera.inertialBetaOffset = decayInertia(camera.inertialBetaOffset, camera.inertia, ROTATION_EPSILON);
		}
		if (camera.inertialRadiusOffset !== 0) {
			camera.radius -= camera.inertialRadiusOffset;
			camera.radius = Math.max(.01, camera.radius);
			camera.inertialRadiusOffset = decayInertia(camera.inertialRadiusOffset, camera.inertia, RADIUS_EPSILON);
		}
		if (camera.inertialPanningX !== 0 || camera.inertialPanningY !== 0) {
			const sinB = Math.sin(camera.beta) || 1e-4;
			const panScale = camera.radius / (sinB <= -1e-10 ? -1e3 : 1e3);
			const panX = (_rightHanded ? -camera.inertialPanningX : camera.inertialPanningX) * panScale;
			const panY = camera.inertialPanningY * panScale;
			const target = camera.target;
			if (Math.abs(sinB) < 1e-10) {
				target.x += panX;
				target.y += panY;
			} else {
				const cosA = Math.cos(camera.alpha);
				const sinA = Math.sin(camera.alpha);
				const panYAcross = Math.cos(camera.beta) * panY;
				target.x -= sinA * panX + cosA * panYAcross;
				target.y += sinB * panY;
				target.z += cosA * panX - sinA * panYAcross;
			}
			camera.inertialPanningX = decayInertia(camera.inertialPanningX, camera.panningInertia, PANNING_EPSILON);
			camera.inertialPanningY = decayInertia(camera.inertialPanningY, camera.panningInertia, PANNING_EPSILON);
		}
	}
	if (scene) scene._beforeRender.push(applyInertia);
	const nonPassive = { passive: false };
	const listeners = [
		["pointerdown", onPointerDown],
		["pointermove", onPointerMove],
		["pointerup", onPointerUp],
		[
			"wheel",
			onWheel,
			nonPassive
		],
		["contextmenu", preventDefault],
		[
			"touchstart",
			onTouchStart,
			nonPassive
		],
		[
			"touchmove",
			onTouchMove,
			nonPassive
		],
		["touchend", onTouchEnd],
		[
			"gesturestart",
			preventDefault,
			nonPassive
		],
		[
			"gesturechange",
			preventDefault,
			nonPassive
		],
		[
			"gestureend",
			preventDefault,
			nonPassive
		]
	];
	for (const [ev, h, opts] of listeners) canvas.addEventListener(ev, h, opts);
	return () => {
		if (scene) {
			const idx = scene._beforeRender.indexOf(applyInertia);
			if (idx >= 0) scene._beforeRender.splice(idx, 1);
		}
		for (const [ev, h] of listeners) canvas.removeEventListener(ev, h);
		keyboardAttachment?.[1]();
	};
}
export { _installArcRotateKeyboardControls, attachControl, setCameraLimits };

//# sourceMappingURL=arc-rotate-controls.js.map