import { ThrowLiteError } from "../lite-error.js";
// src/animation/animation-weight-fade.ts
var fadesByManager;
/** Any `_preUpdate` hook that existed before the fade scheduler installed its own, preserved so
*  the scheduler composes with (rather than clobbers) other per-manager pre-update behavior. */
var priorPreUpdateByManager;
function getFades(manager) {
	fadesByManager ??= /* @__PURE__ */ new WeakMap();
	let fades = fadesByManager.get(manager);
	if (!fades) {
		fades = [];
		fadesByManager.set(manager, fades);
	}
	return fades;
}
/** Per-manager pre-update hook: runs any pre-existing hook first, then advances all scheduled
*  weight fades before the blend mixer runs. A stable module constant so installing it is
*  idempotent — it is never wrapped, so repeated installs cannot grow a wrapper chain. */
function runManagerWeightFades(manager, deltaMs) {
	priorPreUpdateByManager?.get(manager)?.(manager, deltaMs);
	const fades = fadesByManager?.get(manager);
	if (fades) updateFades(fades, deltaMs);
}
/** Install {@link runManagerWeightFades} as the manager's pre-update hook exactly once, preserving
*  any hook that was already present so both run each tick. */
function installWeightFadeHook(manager) {
	if (manager._preUpdate === runManagerWeightFades) return;
	if (manager._preUpdate) (priorPreUpdateByManager ??= /* @__PURE__ */ new WeakMap()).set(manager, manager._preUpdate);
	manager._preUpdate = runManagerWeightFades;
}
/** Animates `group`'s blend weight toward `options.to` over `options.durationMs`.
*
*  Only schedules the weight tween — it does NOT enable blending. The caller must have enabled
*  the appropriate mixer (`enableAnimationBlending` for skeletal/glTF groups, or
*  `enablePropertyAnimationBlending` for property groups); if none is enabled the weight still
*  tweens but no pose is blended.
*  @throws If `to`/`from` are outside `[0, 1]` or the duration is not a finite positive number. */
function fadeAnimationWeight(manager, group, options) {
	const to = validateWeight(options.to);
	const from = options.from === void 0 ? group.weight : validateWeight(options.from);
	if (!(options.durationMs > 0) || !Number.isFinite(options.durationMs)) ThrowLiteError(4, options.durationMs);
	group.weight = from;
	const fades = getFades(manager);
	for (let i = fades.length - 1; i >= 0; i--) if (fades[i].group === group) fades.splice(i, 1);
	fades.push({
		group,
		from,
		to,
		durationMs: options.durationMs,
		elapsedMs: 0
	});
	installWeightFadeHook(manager);
}
/** Cross-fades from `fromGroup` to `toGroup`, fading the first to weight 0 and the second to `options.toWeight` (default 1).
*  Requires blending to be enabled on `manager` (see {@link fadeAnimationWeight}). */
function crossFadeAnimationGroups(manager, fromGroup, toGroup, options) {
	const toWeight = validateWeight(options.toWeight ?? 1);
	fadeAnimationWeight(manager, fromGroup, {
		to: 0,
		durationMs: options.durationMs
	});
	fadeAnimationWeight(manager, toGroup, {
		to: toWeight,
		durationMs: options.durationMs
	});
}
function updateFades(fades, deltaMs) {
	for (let i = fades.length - 1; i >= 0; i--) {
		const fade = fades[i];
		fade.elapsedMs = Math.min(fade.durationMs, fade.elapsedMs + Math.max(0, deltaMs));
		const t = fade.elapsedMs / fade.durationMs;
		fade.group.weight = fade.from + (fade.to - fade.from) * t;
		if (fade.elapsedMs >= fade.durationMs) {
			fade.group.weight = fade.to;
			fades.splice(i, 1);
		}
	}
}
function validateWeight(weight) {
	if (!Number.isFinite(weight) || weight < 0 || weight > 1) ThrowLiteError(5, weight);
	return weight;
}
export { crossFadeAnimationGroups, fadeAnimationWeight };

//# sourceMappingURL=animation-weight-fade.js.map