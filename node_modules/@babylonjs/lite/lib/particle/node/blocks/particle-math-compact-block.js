// src/particle/node/blocks/particle-math-compact-block.ts
function apply(operation, left, right) {
	switch (operation) {
		case 0: return left + right;
		case 1: return left - right;
		case 2: return left * right;
		case 3: return left / right;
		case 4: return Math.max(left, right);
		case 5: return Math.min(left, right);
		default: return left;
	}
}
/** Compact math evaluator for distinct source blocks, whose result scratches cannot alias. */
var particleMathCompactBlock = { build(block, ctx) {
	const operation = typeof block.serialized.operation === "number" ? block.serialized.operation : 0;
	const left = ctx.input(block, "left");
	const right = ctx.input(block, "right");
	const vector2 = {
		x: 0,
		y: 0
	};
	const vector3 = {
		x: 0,
		y: 0,
		z: 0
	};
	const color4 = {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	};
	const getter = (i) => {
		const a = left(i);
		const b = right(i);
		const aScalar = typeof a === "number";
		const bScalar = typeof b === "number";
		if (aScalar && bScalar) return apply(operation, a, b);
		const shape = aScalar ? b : a;
		if (typeof shape !== "number" && "r" in shape) {
			const leftColor = a;
			const rightColor = b;
			color4.r = apply(operation, aScalar ? a : leftColor.r, bScalar ? b : rightColor.r);
			color4.g = apply(operation, aScalar ? a : leftColor.g, bScalar ? b : rightColor.g);
			color4.b = apply(operation, aScalar ? a : leftColor.b, bScalar ? b : rightColor.b);
			color4.a = apply(operation, aScalar ? a : leftColor.a, bScalar ? b : rightColor.a);
			return color4;
		}
		if (typeof shape !== "number" && "z" in shape) {
			const leftVector = a;
			const rightVector = b;
			vector3.x = apply(operation, aScalar ? a : leftVector.x, bScalar ? b : rightVector.x);
			vector3.y = apply(operation, aScalar ? a : leftVector.y, bScalar ? b : rightVector.y);
			vector3.z = apply(operation, aScalar ? a : leftVector.z, bScalar ? b : rightVector.z);
			return vector3;
		}
		const leftVector = a;
		const rightVector = b;
		vector2.x = apply(operation, aScalar ? a : leftVector.x, bScalar ? b : rightVector.x);
		vector2.y = apply(operation, aScalar ? a : leftVector.y, bScalar ? b : rightVector.y);
		return vector2;
	};
	ctx.setOutput(block.id, "output", getter);
} };
export { particleMathCompactBlock };

//# sourceMappingURL=particle-math-compact-block.js.map