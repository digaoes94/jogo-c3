import { F32, I32, U32 } from "../../engine/typed-arrays.js";
// src/material/shader/shader-uniform-range.ts
/** Opt one ShaderMaterial into direct packed-value landing and one ranged upload before each frame. */
function enableShaderUniformRangeUpdates(scene, material) {
	const state = material;
	if (!state._rangeUniformUpdate) installRangeUpdater(state);
	const registrations = state._rangeUniformScenes ??= /* @__PURE__ */ new WeakMap();
	let callback = registrations.get(scene);
	if (!callback) {
		callback = () => state._rangeUniformUpdate(scene.surface.engine);
		registrations.set(scene, callback);
	}
	if (!scene._beforeRender.includes(callback)) scene._beforeRender.push(callback);
}
function installRangeUpdater(material) {
	const dirty = /* @__PURE__ */ new Set();
	let dirtyVersion = -1;
	const mark = (name) => {
		if (dirty.size === 0) dirtyVersion = material._uniformVersion;
		const slot = material._uniformValues.get(name);
		slot._v = (slot._v | 0) + 1;
		dirty.add(name);
	};
	for (const [name, slot] of material._uniformValues) slot.value = trackValue(slot.value, name, mark);
	material._rangeUniformUpdate = (engine) => {
		if (dirty.size === 0) return;
		const spec = material._shaderCustomSpec;
		const data = material._shaderCustomData;
		const buffer = material._shaderCustomUbo;
		if (!spec || !data || !buffer) return;
		const directMutation = material._uniformVersion === dirtyVersion;
		if (!directMutation && material._shaderCustomVersion === material._uniformVersion) {
			dirty.clear();
			dirtyVersion = -1;
			return;
		}
		if (directMutation) {
			material._uniformVersion++;
			material._uboVersion = material._uniformVersion;
		}
		let min = 2147483647;
		let max = -1;
		for (const name of dirty) {
			const slot = material._uniformValues.get(name);
			const offset = spec._offsets.get(name);
			if (offset === void 0) continue;
			writeTypedValue(data, offset, slot.decl.type, slot.value);
			min = Math.min(min, offset);
			max = Math.max(max, offset + slot.value.length * 4);
		}
		if (max > min) engine._device.queue.writeBuffer(buffer, min, data, min, max - min);
		dirty.clear();
		dirtyVersion = -1;
		material._shaderCustomVersion = material._uniformVersion;
	};
}
function trackValue(target, name, mark) {
	const proxy = new Proxy(target, {
		get(array, key) {
			const value = Reflect.get(array, key, array);
			if (typeof value !== "function") return value;
			const fn = value;
			if (key === "subarray") return (...args) => trackValue(fn.apply(array, args), name, mark);
			if (key === "set" || key === "fill" || key === "copyWithin" || key === "reverse" || key === "sort") return (...args) => {
				const result = fn.apply(array, args);
				mark(name);
				return result === array ? proxy : result;
			};
			return fn.bind(array);
		},
		set(array, key, value) {
			const written = Reflect.set(array, key, value, array);
			if (typeof key === "string" && Number.isInteger(Number(key))) mark(name);
			return written;
		}
	});
	return proxy;
}
function writeTypedValue(data, offset, type, value) {
	if (type === "u32") new U32(data, offset, 1)[0] = value[0];
	else if (type === "i32") new I32(data, offset, 1)[0] = value[0];
	else new F32(data, offset, value.length).set(value);
}
export { enableShaderUniformRangeUpdates };

//# sourceMappingURL=shader-uniform-range.js.map