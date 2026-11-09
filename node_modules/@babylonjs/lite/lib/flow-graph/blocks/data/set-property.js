import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
import { pointerTypesCompatible, resolveBlockPointer } from "../../pointer-template.js";
import { setEditorProperty } from "./editor-property.js";
// src/flow-graph/blocks/data/set-property.ts
var setPropertyDef = {
	type: FgBlockType.SetProperty,
	build: (config) => ({
		dataIn: [sockIn("value", config?.type ?? FgType.Any), ...config?.editorPropertyAccess === true ? [sockIn("object", FgType.Any), sockIn("propertyName", FgType.String)] : (config?.pointerSegments ?? []).map((name) => sockIn(name, FgType.Any))],
		signalIn: [sigIn("in")],
		signalOut: [sigOut("out"), sigOut("error")]
	}),
	execute(block, ctx, env) {
		if (block.config?.editorPropertyAccess === true) {
			const success = setEditorProperty(getDataValue(ctx, env, block, "object"), getDataValue(ctx, env, block, "propertyName"), getDataValue(ctx, env, block, "value"));
			activateSignal(ctx, env, block, success ? "out" : "error");
			return;
		}
		const resolved = resolveBlockPointer(block, ctx, env);
		if (resolved?.accessor.set && pointerTypesCompatible(block.config?.type, resolved.accessor.type)) {
			for (const task of ctx.pending) if (task.state.targetKey === `pointer:${resolved.pointer}`) task.canceled = true;
			resolved.accessor.set(getDataValue(ctx, env, block, "value"));
			activateSignal(ctx, env, block, "out");
		} else activateSignal(ctx, env, block, "error");
	}
};
export { setPropertyDef };

//# sourceMappingURL=set-property.js.map