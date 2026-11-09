import { FgType } from "./types.js";
import { fgInt } from "./custom-types/fg-integer.js";
import { getDataValue } from "./runtime.js";
import { parseJsonPointerTemplate, substituteJsonPointerTemplate } from "./gltf/json-pointer-template.js";
// src/flow-graph/pointer-template.ts
function pointerTypesCompatible(declared, actual) {
	return declared === void 0 || declared === FgType.Any || declared === actual || declared === FgType.Vector4 && actual === FgType.Quaternion;
}
function resolveDelayReference(pointer, ctx) {
	const delay = /^\/extensions\/KHR_interactivity\/delays\/(\d+)$/.exec(pointer);
	if (!delay) return;
	const index = Number(delay[1]);
	return ctx.pending.some((task) => !task.canceled && !task.done && task.state.delayIndex === index) ? {
		type: FgType.Reference,
		get: () => fgInt(index)
	} : null;
}
/** Resolve a block's static or data-driven JSON pointer and retain its effective
* path so target-based operations can coordinate interpolation ownership. */
function resolveBlockPointer(block, ctx, env) {
	const staticPointer = block.config?.accessor;
	if (staticPointer) {
		const accessor = resolveDelayReference(staticPointer, ctx) ?? env.accessors[staticPointer] ?? env.resolveAccessor?.(staticPointer) ?? null;
		return accessor ? {
			pointer: staticPointer,
			accessor
		} : null;
	}
	const template = block.config?.pointerTemplate;
	if (!template) return null;
	let parsed;
	try {
		parsed = parseJsonPointerTemplate(template);
	} catch {
		return null;
	}
	const effective = substituteJsonPointerTemplate(parsed, (parameter) => getDataValue(ctx, env, block, parameter.id));
	if (!effective) return null;
	const delayAccessor = resolveDelayReference(effective, ctx);
	if (delayAccessor !== void 0) return delayAccessor ? {
		pointer: effective,
		accessor: delayAccessor
	} : null;
	const cached = env.accessors[effective];
	if (cached) return {
		pointer: effective,
		accessor: cached
	};
	const resolved = env.resolveAccessor?.(effective) ?? null;
	if (resolved) env.accessors[effective] = resolved;
	return resolved ? {
		pointer: effective,
		accessor: resolved
	} : null;
}
/** Resolve only the accessor for ordinary pointer get/set blocks. */
function resolveBlockAccessor(block, ctx, env) {
	return resolveBlockPointer(block, ctx, env)?.accessor ?? null;
}
export { pointerTypesCompatible, resolveBlockAccessor, resolveBlockPointer };

//# sourceMappingURL=pointer-template.js.map