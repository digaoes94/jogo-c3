import { copyXrRigidMatrixToWorld } from "./xr-coordinates.js";
// src/xr/xr-input.ts
function wrap(source) {
	return {
		source,
		handedness: source.handedness,
		targetRayMode: source.targetRayMode,
		targetRayMatrix: /* @__PURE__ */ new Float32Array(16),
		targetRayTracked: false,
		gripMatrix: /* @__PURE__ */ new Float32Array(16),
		gripTracked: false,
		selecting: false,
		squeezing: false,
		gamepad: source.gamepad ?? null
	};
}
/**
* Create an input manager for an active XR session. Wires `select*`/`squeeze*` and
* `inputsourceschange` listeners and seeds the current source list.
*/
function createXrInputManager(session, callbacks) {
	const list = [];
	const bySource = /* @__PURE__ */ new Map();
	const mgr = {
		get inputSources() {
			return mgr._list;
		},
		_list: list,
		_bySource: bySource,
		_session: session,
		_cbs: callbacks,
		_handlers: []
	};
	const addSources = (sources) => {
		const added = [];
		for (let i = 0; i < sources.length; i++) {
			const s = sources[i];
			if (bySource.has(s)) continue;
			const w = wrap(s);
			bySource.set(s, w);
			list.push(w);
			added.push(w);
		}
		return added;
	};
	const removeSources = (sources) => {
		const removed = [];
		for (let i = 0; i < sources.length; i++) {
			const s = sources[i];
			const w = bySource.get(s);
			if (!w) continue;
			bySource.delete(s);
			const idx = list.indexOf(w);
			if (idx >= 0) list.splice(idx, 1);
			removed.push(w);
		}
		return removed;
	};
	const on = (type, fn) => {
		session.addEventListener(type, fn);
		mgr._handlers.push({
			type,
			fn
		});
	};
	on("inputsourceschange", ((e) => {
		const added = addSources(e.added);
		const removed = removeSources(e.removed);
		callbacks.onInputSourcesChange?.(added, removed);
	}));
	const action = (type, flag, cb) => {
		on(type, ((e) => {
			const w = bySource.get(e.inputSource);
			if (!w) return;
			if (type.endsWith("start")) w[flag] = true;
			else if (type.endsWith("end")) w[flag] = false;
			cb?.(w);
		}));
	};
	action("selectstart", "selecting", callbacks.onSelectStart);
	action("select", "selecting", callbacks.onSelect);
	action("selectend", "selecting", callbacks.onSelectEnd);
	action("squeezestart", "squeezing", callbacks.onSqueezeStart);
	action("squeeze", "squeezing", callbacks.onSqueeze);
	action("squeezeend", "squeezing", callbacks.onSqueezeEnd);
	addSources(session.inputSources);
	return mgr;
}
/**
* Refresh every tracked source's target-ray and grip pose for the current frame.
* Call once per `XRFrame`, before reading `inputSources`.
*/
function updateXrInputPoses(mgr, frame, referenceSpace) {
	for (const w of mgr._list) {
		const rayPose = frame.getPose(w.source.targetRaySpace, referenceSpace);
		if (rayPose) {
			copyXrRigidMatrixToWorld(w.targetRayMatrix, rayPose.transform.matrix);
			w.targetRayTracked = true;
		} else w.targetRayTracked = false;
		const grip = w.source.gripSpace;
		if (grip) {
			const gripPose = frame.getPose(grip, referenceSpace);
			if (gripPose) {
				copyXrRigidMatrixToWorld(w.gripMatrix, gripPose.transform.matrix);
				w.gripTracked = true;
			} else w.gripTracked = false;
		} else w.gripTracked = false;
	}
}
/** Detach all session listeners and clear tracked sources. */
function disposeXrInputManager(mgr) {
	for (const { type, fn } of mgr._handlers) mgr._session.removeEventListener(type, fn);
	mgr._handlers.length = 0;
	mgr._list.length = 0;
	mgr._bySource.clear();
}
export { createXrInputManager, disposeXrInputManager, updateXrInputPoses };

//# sourceMappingURL=xr-input.js.map