// src/loader-gltf/khr-interactivity-helpers.ts
function hasDefaultInteractivityFlowInput(operation) {
	return operation !== "flow/waitAll" && (operation.startsWith("flow/") || operation.startsWith("animation/") || operation === "pointer/set" || operation === "pointer/interpolate" || operation === "variable/set" || operation === "variable/interpolate" || operation === "event/send" || operation === "event/stopPropagation" || operation === "flow/log:BABYLON");
}
function normalizeInteractivityEventValue(value) {
	if (Array.isArray(value)) return value.slice();
	if (value !== null && typeof value === "object") {
		const arrayValue = value.asArray;
		if (typeof arrayValue === "function") return Array.from(arrayValue.call(value));
		if (Object.prototype.hasOwnProperty.call(value, "value")) {
			const nested = value.value;
			return Array.isArray(nested) ? nested.slice() : [nested];
		}
	}
	return [value];
}
function normalizeInteractivityEventDataConfiguration(value) {
	if (Array.isArray(value)) return value.filter((entry) => entry !== null && typeof entry === "object" && typeof entry.id === "string").map((entry) => ({
		id: entry.id,
		type: entry.type,
		...entry.value === void 0 ? {} : { value: normalizeInteractivityEventValue(entry.value) }
	})).sort((left, right) => left.id.localeCompare(right.id));
	if (value !== null && typeof value === "object") return Object.entries(value).map(([id, entry]) => {
		if (entry === null || typeof entry !== "object") return {
			id,
			malformed: true
		};
		const definition = entry;
		return {
			id,
			type: typeof definition.type === "string" ? definition.type : definition.type?.typeName,
			...definition.value === void 0 ? {} : { value: normalizeInteractivityEventValue(definition.value) }
		};
	}).sort((left, right) => left.id.localeCompare(right.id));
	return value;
}
function normalizeKhrInteractivityRuntimeValue(value) {
	if (value === void 0) return;
	if (value !== null && typeof value === "object") {
		const arrayValue = value.asArray;
		if (typeof arrayValue === "function") return Array.from(arrayValue.call(value));
		if ("value" in value && typeof value.value !== "object") return [value.value];
	}
	return Array.isArray(value) ? value.slice() : [value];
}
function encodeKhrInteractivityRuntimeValue(value, ancestors) {
	if (value === void 0) return ["undefined"];
	if (value === null) return ["null"];
	if (typeof value === "boolean" || typeof value === "string") return [typeof value, value];
	if (typeof value === "number") return ["number", Number.isNaN(value) ? "NaN" : value === Infinity ? "Infinity" : value === -Infinity ? "-Infinity" : Object.is(value, -0) ? "-0" : value];
	if (typeof value !== "object" || Object.getOwnPropertySymbols(value).length !== 0 || ancestors.has(value)) return;
	if (Array.isArray(value)) {
		if (Object.getOwnPropertyNames(value).some((key) => {
			if (key === "length") return false;
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			return !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length || !descriptor || !("value" in descriptor);
		})) return;
	} else {
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null) return;
		if (Object.getOwnPropertyNames(value).some((key) => {
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			return !Object.prototype.propertyIsEnumerable.call(value, key) || !descriptor || !("value" in descriptor);
		})) return;
	}
	ancestors.add(value);
	const encoded = Array.isArray(value) ? value.map((entry) => encodeKhrInteractivityRuntimeValue(entry, ancestors)) : Object.keys(value).sort().map((key) => [key, encodeKhrInteractivityRuntimeValue(value[key], ancestors)]);
	ancestors.delete(value);
	if (encoded.some((entry) => Array.isArray(value) ? entry === void 0 : entry[1] === void 0)) return;
	return [Array.isArray(value) ? "array" : "object", encoded];
}
function createKhrInteractivityRuntimeValueSnapshot(value) {
	try {
		const encoded = encodeKhrInteractivityRuntimeValue(Array.isArray(value) ? value : normalizeKhrInteractivityRuntimeValue(value), /* @__PURE__ */ new Set());
		return encoded === void 0 ? { unrepresentable: true } : { runtimeValueFingerprint: JSON.stringify(encoded) };
	} catch {
		return { unrepresentable: true };
	}
}
export { createKhrInteractivityRuntimeValueSnapshot, hasDefaultInteractivityFlowInput, normalizeInteractivityEventDataConfiguration, normalizeKhrInteractivityRuntimeValue };

//# sourceMappingURL=khr-interactivity-helpers.js.map