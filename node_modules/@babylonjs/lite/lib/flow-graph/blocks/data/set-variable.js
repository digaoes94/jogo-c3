import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/data/set-variable.ts
var setVariableDef = {
	type: FgBlockType.SetVariable,
	build: (config) => ({
		dataIn: Array.isArray(config?.variables) ? config.variables.map((name) => sockIn(String(name), (config?.variableTypes)?.[String(name)] ?? FgType.Any)) : [sockIn("value", FgType.Any)],
		signalIn: [sigIn("in")],
		signalOut: [sigOut("out")]
	}),
	execute(block, ctx, env) {
		const variables = block.config?.variables;
		if (variables) for (const variable of variables) {
			const name = String(variable);
			cancelVariableInterpolation(ctx, name);
			ctx.userVariables[name] = getDataValue(ctx, env, block, name);
		}
		else {
			const name = block.config?.variable;
			if (name !== void 0) {
				cancelVariableInterpolation(ctx, name);
				ctx.userVariables[name] = getDataValue(ctx, env, block, "value");
			}
		}
		activateSignal(ctx, env, block, "out");
	}
};
function cancelVariableInterpolation(ctx, name) {
	for (const task of ctx.pending) if (task.state.targetKey === `variable:${name}`) task.canceled = true;
}
export { setVariableDef };

//# sourceMappingURL=set-variable.js.map