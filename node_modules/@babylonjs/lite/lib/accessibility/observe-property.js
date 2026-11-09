// src/accessibility/observe-property.ts
var observations;
function descriptorOf(target, key) {
	for (let current = target; current; current = Object.getPrototypeOf(current)) {
		const descriptor = Object.getOwnPropertyDescriptor(current, key);
		if (descriptor) return descriptor;
	}
}
/** @internal Observe direct writes and restore the original property shape after the last listener leaves. */
function observeProperty(target, key, listener) {
	const byProperty = (observations ??= /* @__PURE__ */ new WeakMap()).get(target) ?? /* @__PURE__ */ new Map();
	observations.set(target, byProperty);
	let observer = byProperty.get(key);
	if (!observer) {
		const own = Object.getOwnPropertyDescriptor(target, key);
		const descriptor = own ?? descriptorOf(Object.getPrototypeOf(target), key);
		if (own && !own.configurable) return () => {};
		observer = {
			descriptor: own,
			inheritedAccessor: !own && !!(descriptor?.get || descriptor?.set),
			value: descriptor?.get ? descriptor.get.call(target) : own?.value ?? target[key],
			listeners: /* @__PURE__ */ new Set()
		};
		const state = observer;
		Object.defineProperty(target, key, {
			configurable: true,
			enumerable: own?.enumerable ?? true,
			get: descriptor?.get ? () => descriptor.get.call(target) : () => state.value,
			set: (value) => {
				const previous = descriptor?.get ? descriptor.get.call(target) : state.value;
				if (descriptor?.set) descriptor.set.call(target, value);
				else state.value = value;
				if ((descriptor?.get ? descriptor.get.call(target) : state.value) !== previous) for (const callback of [...state.listeners]) callback();
			}
		});
		byProperty.set(key, observer);
	}
	observer.listeners.add(listener);
	return () => {
		observer.listeners.delete(listener);
		if (observer.listeners.size) return;
		const current = target[key];
		if (observer.descriptor) {
			const restored = { ...observer.descriptor };
			if ("value" in restored) restored.value = current;
			Object.defineProperty(target, key, restored);
		} else {
			delete target[key];
			if (!observer.inheritedAccessor && current !== void 0) Object.defineProperty(target, key, {
				configurable: true,
				enumerable: true,
				writable: true,
				value: current
			});
		}
		byProperty.delete(key);
		if (!byProperty.size) observations?.delete(target);
	};
}
export { observeProperty };

//# sourceMappingURL=observe-property.js.map