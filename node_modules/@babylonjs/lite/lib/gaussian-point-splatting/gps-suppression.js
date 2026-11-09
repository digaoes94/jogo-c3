// src/gaussian-point-splatting/gps-suppression.ts
var trackers = null;
function createStaticWork(mesh, pointOnly) {
	let suspended = false;
	let waiting = false;
	const work = {
		ready: true,
		update(run) {
			if (pointOnly()) {
				if (mesh._firstSortResolve) run();
				else {
					suspended = true;
					work.ready = false;
				}
				return;
			}
			if (suspended) {
				if (mesh._pendingOrder) {
					mesh._orderPool.push(mesh._pendingOrder);
					mesh._pendingOrder = null;
				}
				if (mesh._orderPool.length < 2) return;
				mesh._sortDepthTransform.fill(Infinity);
				run();
				waiting = mesh._orderPool.length < 2;
				suspended = !waiting;
				return;
			}
			if (waiting) {
				if (!mesh._pendingOrder) return;
				run();
				waiting = mesh._pendingOrder !== null;
				work.ready = !waiting;
				return;
			}
			run();
		}
	};
	return work;
}
function createTracker(scene) {
	const targets = /* @__PURE__ */ new Map();
	const candidates = /* @__PURE__ */ new Map();
	let rejected = /* @__PURE__ */ new WeakSet();
	const restore = (classic, candidate) => {
		candidate.active = false;
		candidate.restoreBatches.forEach((restoreBatch) => restoreBatch());
		candidate.restoreBatches.clear();
		if (candidate.work && !candidate.work.ready) return;
		if (classic.bind === candidate.replacement) {
			classic.bind = candidate.original;
			scene._renderableVersion++;
		}
		candidates.delete(classic);
	};
	const wrap = (classic, known) => {
		const original = classic.bind;
		const candidate = {
			original,
			target: known,
			active: true,
			work: null,
			restoreBatches: /* @__PURE__ */ new Map(),
			replacement(engine, signature) {
				const binding = original.call(this, engine, signature);
				const draw = binding.draw;
				const gps = candidate.target;
				if (gps && "_gpu" in gps._target) {
					const stream = gps._target;
					for (const batch of binding._updateBatches ?? []) {
						if (!("passGpu" in batch) || !("queue" in batch)) continue;
						const streamBatch = batch;
						if (candidate.restoreBatches.has(streamBatch)) continue;
						const queue = streamBatch.queue;
						const replacement = function(projection) {
							const paused = candidate.active && gps.colorRenderMode && !gps._disabled && stream._coarseSubmitted;
							queue.call(this, paused ? {
								...projection,
								key: this.passGpu.lastKey
							} : projection);
						};
						streamBatch.queue = replacement;
						candidate.restoreBatches.set(streamBatch, () => {
							if (streamBatch.queue === replacement) streamBatch.queue = queue;
						});
					}
				}
				const proxies = /* @__PURE__ */ new WeakMap();
				let issued = false;
				let suppressed = false;
				return {
					...binding,
					update(context) {
						if (candidate.work) {
							candidate.work.update(() => binding.update?.(context));
							if (!candidate.active && candidate.work.ready) restore(classic, candidate);
						} else binding.update?.(context);
					},
					draw(pass, currentEngine) {
						if (candidate.work && !candidate.work.ready && (!candidate.active || !candidate.target?.colorRenderMode || candidate.target._disabled)) return 0;
						if (!candidate.active || candidate.target && !candidate.target.colorRenderMode) return draw.call(binding, pass, currentEngine);
						let proxy = proxies.get(pass);
						if (!proxy) {
							proxy = new Proxy(pass, { get(object, key) {
								const value = Reflect.get(object, key, object);
								if (key === "setVertexBuffer") return (...args) => {
									if (!candidate.target && args[1]) for (const gps of targets.keys()) {
										const mesh = gps._target;
										if ("_gs" in mesh && mesh._gs._splatIndexBuffer === args[1]) {
											candidate.target = gps;
											if ("_orderPool" in mesh) candidate.work = createStaticWork(mesh, () => candidate.active && gps.colorRenderMode && !gps._disabled);
											break;
										}
									}
									return object.setVertexBuffer(...args);
								};
								if (key === "draw" || key === "drawIndexed" || key === "drawIndirect" || key === "drawIndexedIndirect") return (...args) => {
									issued = true;
									if (candidate.target?.colorRenderMode && !candidate.target._disabled) {
										suppressed = true;
										return;
									}
									return Reflect.apply(value, object, args);
								};
								return typeof value === "function" ? value.bind(object) : value;
							} });
							proxies.set(pass, proxy);
						}
						issued = suppressed = false;
						const count = draw.call(binding, proxy, currentEngine);
						if (issued && !candidate.target) {
							rejected.add(classic);
							restore(classic, candidate);
						}
						return suppressed ? 0 : count;
					}
				};
			}
		};
		candidates.set(classic, candidate);
		classic.bind = candidate.replacement;
		scene._renderableVersion++;
	};
	const refresh = () => {
		for (const [classic, candidate] of candidates) if (!scene._renderables.includes(classic)) restore(classic, candidate);
		const handles = [...targets.keys()];
		const pointRenderables = [...targets.values()];
		const staticTargets = handles.some((gps) => "_gs" in gps._target);
		for (const classic of scene._renderables) {
			if (pointRenderables.includes(classic)) continue;
			const known = handles.find((gps) => "_renderable" in gps._target && gps._target._renderable === classic) ?? null;
			const candidate = candidates.get(classic);
			if (candidate) {
				candidate.target ??= known;
				continue;
			}
			if (!known && rejected.has(classic)) continue;
			if (known || staticTargets && classic.order === 200 && classic.isTransparent) wrap(classic, known);
		}
	};
	scene._beforeRender.push(refresh);
	return {
		add(gps, renderable) {
			targets.set(gps, renderable);
			rejected = /* @__PURE__ */ new WeakSet();
			refresh();
		},
		remove(gps) {
			targets.delete(gps);
			for (const [classic, candidate] of candidates) if (!targets.size || candidate.target === gps) {
				rejected.add(classic);
				restore(classic, candidate);
			}
			if (!targets.size) {
				const index = scene._beforeRender.indexOf(refresh);
				if (index >= 0) scene._beforeRender.splice(index, 1);
				trackers?.delete(scene);
			}
		}
	};
}
/** @internal Observe classic draws without adding metadata or branches to classic GS modules. */
function installGpsDrawSuppression(scene, gps, renderable) {
	trackers ??= /* @__PURE__ */ new WeakMap();
	let tracker = trackers.get(scene);
	if (!tracker) {
		tracker = createTracker(scene);
		trackers.set(scene, tracker);
	}
	tracker.add(gps, renderable);
	return () => tracker.remove(gps);
}
export { installGpsDrawSuppression };

//# sourceMappingURL=gps-suppression.js.map