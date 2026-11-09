import { makeExtraContextualGetter } from "../npe-contextual-extra.js";
// src/particle/node/blocks/particle-input-extra-block.ts
/** `ParticleInputBlock` evaluator for contextual sources outside the common particle-scene subset. */
var particleInputExtraBlock = { build(block, ctx) {
	const source = typeof block.serialized.contextualValue === "number" ? block.serialized.contextualValue : 0;
	ctx.setOutput(block.id, "output", makeExtraContextualGetter(ctx.state.buffer, ctx.state.system, source));
} };
export { particleInputExtraBlock };

//# sourceMappingURL=particle-input-extra-block.js.map