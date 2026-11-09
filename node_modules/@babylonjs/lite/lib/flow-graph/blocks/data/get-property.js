import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { defaultForType } from "../../rich-type.js";
import { getDataValue, setDataValue } from "../../runtime.js";
import { sockIn, sockOut } from "../../sockets.js";
import { pointerTypesCompatible, resolveBlockAccessor } from "../../pointer-template.js";
import { getEditorProperty } from "./editor-property.js";
// src/flow-graph/blocks/data/get-property.ts
var getPropertyDef = {
	type: FgBlockType.GetProperty,
	build: (config) => ({
		dataIn: config?.editorPropertyAccess === true ? [sockIn("object", FgType.Any), sockIn("propertyName", FgType.String)] : (config?.pointerSegments ?? []).map((name) => sockIn(name, FgType.Any)),
		dataOut: [sockOut("value", config?.type ?? FgType.Any), sockOut("isValid", FgType.Boolean)]
	}),
	updateOutputs(block, ctx, env) {
		if (block.config?.editorPropertyAccess === true) {
			const result = getEditorProperty(getDataValue(ctx, env, block, "object"), getDataValue(ctx, env, block, "propertyName"));
			setDataValue(ctx, block, "value", result.value);
			setDataValue(ctx, block, "isValid", result.valid);
			return;
		}
		const accessor = resolveBlockAccessor(block, ctx, env);
		const valid = !!accessor && pointerTypesCompatible(block.config?.type, accessor.type);
		const type = block.config?.type ?? FgType.Any;
		const value = valid ? accessor.get() : defaultForType(type);
		setDataValue(ctx, block, "value", value);
		setDataValue(ctx, block, "isValid", valid);
	}
};
export { getPropertyDef };

//# sourceMappingURL=get-property.js.map