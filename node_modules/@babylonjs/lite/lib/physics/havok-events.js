// src/physics/havok-events.ts
/** @internal Installs body lifetime tracking only when body-aware Havok events are enabled. */
function ensureHavokEventContext(world) {
	if (world._events) return world._events;
	let draining = false;
	let removed;
	const bodiesByNativeId = /* @__PURE__ */ new Map();
	const forEachInstance = (body, callback) => {
		const count = world._thin?.count(body);
		if (count === void 0) {
			callback(Number(body._hkBody[0]), [
				body,
				body._hkBody,
				0
			]);
			return;
		}
		for (let index = 0; index < count; index++) {
			const handle = world._thin.instance(body, index);
			if (handle) callback(Number(handle[0]), [
				body,
				handle,
				index
			]);
		}
	};
	const add = (body) => {
		forEachInstance(body, (nativeId, resolved) => bodiesByNativeId.set(nativeId, resolved));
	};
	const drop = (body) => {
		forEachInstance(body, (nativeId) => {
			if (bodiesByNativeId.get(nativeId)?.[0] === body) bodiesByNativeId.delete(nativeId);
		});
	};
	const releaseRemoved = () => {
		const deferred = removed;
		removed = void 0;
		if (deferred) for (const body of deferred) {
			drop(body);
			world._hknp.HP_Body_Release(body._hkBody);
		}
	};
	const context = {
		begin() {
			draining = true;
		},
		end() {
			draining = false;
			releaseRemoved();
		},
		add,
		remove(body) {
			if (draining) {
				(removed ??= []).push(body);
				return true;
			}
			drop(body);
			return false;
		},
		resolve(nativeId) {
			return bodiesByNativeId.get(Number(nativeId)) ?? null;
		},
		dispose() {
			draining = false;
			releaseRemoved();
			bodiesByNativeId.clear();
		}
	};
	for (const body of world._bodies) add(body);
	world._events = context;
	return context;
}
export { ensureHavokEventContext };

//# sourceMappingURL=havok-events.js.map