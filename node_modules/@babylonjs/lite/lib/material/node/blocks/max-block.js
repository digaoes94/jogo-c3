import { binaryEmitter } from "./_math-factory.js";
// src/material/node/blocks/max-block.ts
var emitter = binaryEmitter("MaxBlock", (l, r) => `max(${l}, ${r})`);
export { emitter };

//# sourceMappingURL=max-block.js.map