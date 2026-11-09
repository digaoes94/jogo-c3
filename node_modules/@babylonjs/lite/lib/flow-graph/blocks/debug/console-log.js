import { FgBlockType } from "../../block-type.js";
import { FgType } from "../../types.js";
import { activateSignal, getDataValue } from "../../runtime.js";
import { sigIn, sigOut, sockIn } from "../../sockets.js";
// src/flow-graph/blocks/debug/console-log.ts
var PLACEHOLDER = /\{([^}]+)\}/g;
function templateMatches(template) {
	const matches = [];
	let m;
	PLACEHOLDER.lastIndex = 0;
	while ((m = PLACEHOLDER.exec(template)) !== null) matches.push(m[1]);
	return matches;
}
function serializeValue(value) {
	if (value === null) return String(value);
	if (typeof value === "object") try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
	return String(value);
}
var consoleLogDef = {
	type: FgBlockType.ConsoleLog,
	build: (config) => {
		const template = config?.messageTemplate;
		const shape = {
			dataIn: [sockIn("message", FgType.Any)],
			signalIn: [sigIn("in")],
			signalOut: [sigOut("out")]
		};
		if (template) {
			for (const name of templateMatches(template)) if (name !== "message" && !shape.dataIn.some((s) => s.name === name)) shape.dataIn.push(sockIn(name, FgType.Any));
		}
		return shape;
	},
	execute(block, ctx, env) {
		const template = block.config?.messageTemplate;
		let message;
		if (template) {
			const messageVal = getDataValue(ctx, env, block, "message");
			const messageObj = messageVal !== null && typeof messageVal === "object" ? messageVal : null;
			let rendered = template;
			for (const name of templateMatches(template)) {
				const value = messageObj && name in messageObj ? messageObj[name] : getDataValue(ctx, env, block, name);
				if (value !== void 0) {
					const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
					rendered = rendered.replace(new RegExp(`\\{${escaped}\\}`, "g"), serializeValue(value));
				}
			}
			message = rendered;
		} else message = getDataValue(ctx, env, block, "message");
		console.log(message);
		activateSignal(ctx, env, block, "out");
	}
};
export { consoleLogDef };

//# sourceMappingURL=console-log.js.map