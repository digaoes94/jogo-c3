import { createRandomDraw } from "./particle-random-block.js";
import { createOnceRandomGetter } from "./particle-random-once.js";
// src/particle/node/blocks/particle-random-once-block.ts
/** Scalar `ParticleRandomBlock` evaluator for OncePerParticle lock mode. */
var particleRandomOnceBlock = { build(block, ctx) {
	const draw = createRandomDraw(ctx.input(block, "min", () => 0), ctx.input(block, "max", () => 1));
	ctx.setOutput(block.id, "output", createOnceRandomGetter(ctx.state.buffer, block.id, draw));
} };
export { particleRandomOnceBlock };

//# sourceMappingURL=particle-random-once-block.js.map