import { binaryEmitter } from "./_math-factory.js";
// src/material/node/blocks/min-block.ts
var emitter = binaryEmitter("MinBlock", (l, r) => `min(${l}, ${r})`);
export { emitter };

//# sourceMappingURL=min-block.js.map