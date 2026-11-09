import { emitPreparedShadow } from "./node-shadow-emitter.js";
import { shadowAlgorithm } from "../../shader/fragments/shadow-fragment-esm.js";
import { shadowAlgorithm as shadowAlgorithm$1 } from "../../shader/fragments/shadow-fragment-pcf.js";
// src/material/node/node-shadow.ts
/** Combined synchronous compatibility entry. Material parsing uses algorithm-specific preparation. */
var algorithms = {
	esm: shadowAlgorithm,
	pcf: shadowAlgorithm$1
};
/** Emit Node shadow declarations with both sampling algorithms available. */
var emitShadow = (slots, startBinding, varyings) => emitPreparedShadow(slots, startBinding, varyings, algorithms);
export { emitShadow };

//# sourceMappingURL=node-shadow.js.map