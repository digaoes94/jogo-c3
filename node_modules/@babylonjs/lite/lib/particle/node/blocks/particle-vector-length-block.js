// src/particle/node/blocks/particle-vector-length-block.ts
function vectorLength(value) {
	if (typeof value === "number") return Math.abs(value);
	if ("z" in value) {
		const vector = value;
		return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
	}
	if ("r" in value) {
		const color = value;
		return Math.sqrt(color.r * color.r + color.g * color.g + color.b * color.b + color.a * color.a);
	}
	const vector = value;
	return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}
/** `ParticleVectorLengthBlock` — return the magnitude of a scalar, vector, or color. */
var particleVectorLengthBlock = { build(block, ctx) {
	const input = ctx.input(block, "input");
	const getter = (i) => vectorLength(input(i));
	ctx.setOutput(block.id, "output", getter);
} };
export { particleVectorLengthBlock };

//# sourceMappingURL=particle-vector-length-block.js.map