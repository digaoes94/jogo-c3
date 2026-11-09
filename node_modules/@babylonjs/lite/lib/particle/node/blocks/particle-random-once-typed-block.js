import { createRandomDraw } from "./particle-random-block.js";
import { createTypedOnceRandomGetter } from "./particle-random-once-typed.js";
// src/particle/node/blocks/particle-random-once-typed-block.ts
/** Vector/color `ParticleRandomBlock` evaluator for OncePerParticle lock mode. */
var particleRandomOnceTypedBlock = { build(block, ctx) {
	const valueType = block.inputs.find((input) => input.name === "min")?.valueType ?? block.inputs.find((input) => input.name === "max")?.valueType ?? "BABYLON.Vector3";
	const draw = createRandomDraw(ctx.input(block, "min", () => 0), ctx.input(block, "max", () => 1));
	ctx.setOutput(block.id, "output", createTypedOnceRandomGetter(ctx.state.buffer, block.id, draw, valueType));
} };
export { particleRandomOnceTypedBlock };

//# sourceMappingURL=particle-random-once-typed-block.js.map