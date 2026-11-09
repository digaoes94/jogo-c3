// src/shadow/csm-refit-gate.ts
function casterVersion(caster) {
	return caster.worldMatrixVersion + ~~caster.thinInstances?._version;
}
/** Create a refit gate. One instance per CSM generator task state. */
function createCsmRefitGate(options) {
	const refitAngle = options.refitAngle;
	const refitMaxIntervalMs = options.refitMaxIntervalMs;
	const demoteQuietFrames = options.demoteQuietFrames ?? 120;
	const slots = /* @__PURE__ */ new Map();
	let casters = [];
	let lastStaticSum = 0;
	let lastDynamicSum = 0;
	let casterSetChanged = false;
	let hasRefit = false;
	let refitDirX = 0;
	let refitDirY = 0;
	let refitDirZ = 0;
	let lastRefitMs = 0;
	let framesSinceRefit = 0;
	let lastDriftOnly = false;
	let lastDynamicChanged = false;
	return {
		syncCasters(next) {
			if (next === casters) return;
			const nextSet = new Set(next);
			let membershipChanged = nextSet.size !== slots.size;
			for (const m of slots.keys()) if (!nextSet.has(m)) {
				slots.delete(m);
				membershipChanged = true;
			}
			for (const m of next) if (!slots.has(m)) {
				slots.set(m, {
					_last: casterVersion(m),
					_dynamic: true,
					_quiet: 0
				});
				membershipChanged = true;
			}
			casters = next;
			casterSetChanged ||= membershipChanged;
		},
		markDynamic(caster) {
			const slot = slots.get(caster);
			if (slot && !slot._dynamic) {
				slot._dynamic = true;
				slot._quiet = 0;
			}
		},
		isDynamic(caster) {
			return slots.get(caster)?._dynamic ?? true;
		},
		_lastRefitDriftOnly() {
			return lastDriftOnly;
		},
		_lastDynamicChanged() {
			return lastDynamicChanged;
		},
		update(lightDirX, lightDirY, lightDirZ, nowMs, cameraChanged, force, onPromote, onDemote) {
			framesSinceRefit++;
			let staticSum = 0;
			let dynamicSum = 0;
			let dynamicChanged = false;
			let promoted = false;
			let pendingDemotions = 0;
			for (const m of casters) {
				const slot = slots.get(m);
				const v = casterVersion(m);
				const changed = v !== slot._last;
				slot._last = v;
				if (slot._dynamic) {
					dynamicChanged ||= changed;
					slot._quiet = changed ? 0 : slot._quiet + 1;
					if (slot._quiet >= demoteQuietFrames) pendingDemotions++;
					dynamicSum += v;
				} else if (changed) {
					slot._dynamic = true;
					slot._quiet = 0;
					promoted = true;
					onPromote(m);
					dynamicSum += v;
				} else staticSum += v;
			}
			const len = Math.hypot(lightDirX, lightDirY, lightDirZ) || 1;
			const nx = lightDirX / len;
			const ny = lightDirY / len;
			const nz = lightDirZ / len;
			const drifted = hasRefit && (nx !== refitDirX || ny !== refitDirY || nz !== refitDirZ);
			let angleExceeded = false;
			if (drifted) {
				const dot = Math.min(1, Math.max(-1, nx * refitDirX + ny * refitDirY + nz * refitDirZ));
				angleExceeded = Math.acos(dot) > refitAngle;
			}
			const intervalElapsed = refitMaxIntervalMs > 0 && nowMs - lastRefitMs >= refitMaxIntervalMs;
			const membershipCause = force || !hasRefit || casterSetChanged || promoted || staticSum !== lastStaticSum || cameraChanged || pendingDemotions > 0 && framesSinceRefit >= demoteQuietFrames;
			const refit = membershipCause || angleExceeded || intervalElapsed;
			let demoted = 0;
			if (refit) {
				for (const m of casters) {
					const slot = slots.get(m);
					if (slot._dynamic && slot._quiet >= demoteQuietFrames) {
						slot._dynamic = false;
						onDemote(m);
						demoted++;
						staticSum += slot._last;
						dynamicSum -= slot._last;
					}
				}
				hasRefit = true;
				casterSetChanged = false;
				refitDirX = nx;
				refitDirY = ny;
				refitDirZ = nz;
				lastRefitMs = nowMs;
				framesSinceRefit = 0;
			}
			lastDynamicChanged = dynamicChanged || dynamicSum !== lastDynamicSum;
			const renderDynamic = refit || lastDynamicChanged;
			lastDriftOnly = refit && !membershipCause && demoted === 0;
			lastStaticSum = staticSum;
			lastDynamicSum = dynamicSum;
			return {
				refit,
				renderDynamic
			};
		}
	};
}
/** @internal Create the scheduler for `cascadeCount` cascades and a per-frame budget of `cascadesPerFrame`
*  static re-renders. A budget of 0 (or one that covers every cascade) disables the spread: every
*  refit re-renders all cascades in its own frame, the historical behaviour. */
function createCsmStaticRefitScheduler(cascadeCount, cascadesPerFrame) {
	const count = Math.max(0, Math.floor(cascadeCount));
	const budget = Number.isFinite(cascadesPerFrame) && cascadesPerFrame > 0 && cascadesPerFrame < count ? Math.floor(cascadesPerFrame) : 0;
	const waiting = new Array(count).fill(false);
	const out = [];
	let waitingCount = 0;
	let immediate = false;
	let cursor = 0;
	return {
		arm(spread) {
			waiting.fill(true);
			waitingCount = count;
			immediate = budget === 0 || !spread;
		},
		pending() {
			return waitingCount > 0;
		},
		take() {
			out.length = 0;
			if (waitingCount === 0) return out;
			const limit = immediate ? count : budget;
			for (let step = 0; step < count && out.length < limit; step++) {
				const cascade = (cursor + step) % count;
				if (waiting[cascade]) {
					waiting[cascade] = false;
					waitingCount--;
					out.push(cascade);
				}
			}
			if (out.length > 0) cursor = (out[out.length - 1] + 1) % count;
			if (waitingCount === 0) immediate = false;
			return out;
		},
		claim(cascade) {
			if (waiting[cascade]) {
				waiting[cascade] = false;
				waitingCount--;
				if (waitingCount === 0) immediate = false;
			}
		},
		maxLagFrames() {
			return budget === 0 ? 0 : Math.ceil(count / budget) - 1;
		}
	};
}
export { createCsmRefitGate, createCsmStaticRefitScheduler };

//# sourceMappingURL=csm-refit-gate.js.map