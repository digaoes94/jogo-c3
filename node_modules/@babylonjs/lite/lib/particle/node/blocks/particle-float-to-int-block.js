// src/particle/node/blocks/particle-float-to-int-block.ts
var OP_ROUND = 0;
var OP_CEIL = 1;
var OP_FLOOR = 2;
var OP_TRUNCATE = 3;
/** `ParticleFloatToIntBlock` — convert a scalar via round, ceil, floor, or truncate. */
var particleFloatToIntBlock = { build(block, ctx) {
	const operation = typeof block.serialized.operation === "number" ? block.serialized.operation : OP_ROUND;
	const input = ctx.input(block, "input", () => 0);
	const getter = (i) => {
		const value = input(i);
		switch (operation) {
			case OP_CEIL: return Math.ceil(value);
			case OP_FLOOR: return Math.floor(value);
			case OP_TRUNCATE: return Math.trunc(value);
			default: return Math.round(value);
		}
	};
	ctx.setOutput(block.id, "output", getter);
} };
export { particleFloatToIntBlock };

//# sourceMappingURL=particle-float-to-int-block.js.map