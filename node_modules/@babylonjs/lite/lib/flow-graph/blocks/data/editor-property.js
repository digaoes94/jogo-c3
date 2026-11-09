// src/flow-graph/blocks/data/editor-property.ts
function propertyPath(propertyName) {
	if (typeof propertyName !== "string" || propertyName.length === 0) return null;
	const path = propertyName.split(".");
	return path.every((part) => part.length > 0 && part !== "__proto__" && part !== "constructor" && part !== "prototype") ? path : null;
}
function propertyObject(value) {
	return typeof value === "object" && value !== null ? value : null;
}
function getEditorProperty(object, propertyName) {
	const path = propertyPath(propertyName);
	let current = object;
	if (!path) return {
		valid: false,
		value: null
	};
	try {
		for (const part of path) {
			const owner = propertyObject(current);
			if (!owner) return {
				valid: false,
				value: null
			};
			current = Reflect.get(owner, part);
		}
	} catch {
		return {
			valid: false,
			value: null
		};
	}
	return {
		valid: true,
		value: current ?? null
	};
}
function setEditorProperty(object, propertyName, value) {
	const path = propertyPath(propertyName);
	let owner = propertyObject(object);
	if (!path || !owner) return false;
	try {
		for (const part of path.slice(0, -1)) {
			let child = propertyObject(Reflect.get(owner, part));
			if (!child) {
				child = {};
				if (!Reflect.set(owner, part, child)) return false;
			}
			owner = child;
		}
		return Reflect.set(owner, path[path.length - 1], value);
	} catch {
		return false;
	}
}
export { getEditorProperty, setEditorProperty };

//# sourceMappingURL=editor-property.js.map