// src/particle/node/blocks/particle-gradient-value-block.ts
/** `ParticleGradientValueBlock` — emits gradient-stop metadata for its parent gradient block. */
var particleGradientValueBlock = { build(block, ctx) {
	const entry = {
		reference: typeof block.serialized.reference === "number" ? block.serialized.reference : 0,
		value: ctx.input(block, "value", () => 0)
	};
	ctx.setOutput(block.id, "output", () => entry);
} };
export { particleGradientValueBlock };

//# sourceMappingURL=particle-gradient-value-block.js.map