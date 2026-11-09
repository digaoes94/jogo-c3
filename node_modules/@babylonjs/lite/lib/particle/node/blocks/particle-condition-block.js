// src/particle/node/blocks/particle-condition-block.ts
var TEST_EQUAL = 0;
var TEST_NOT_EQUAL = 1;
var TEST_LESS_THAN = 2;
var TEST_GREATER_THAN = 3;
var TEST_LESS_OR_EQUAL = 4;
var TEST_GREATER_OR_EQUAL = 5;
var TEST_XOR = 6;
var TEST_OR = 7;
var TEST_AND = 8;
function evaluate(test, left, right, epsilon) {
	switch (test) {
		case TEST_EQUAL: return Math.abs(left - right) <= epsilon;
		case TEST_NOT_EQUAL: return Math.abs(left - right) > epsilon;
		case TEST_LESS_THAN: return left < right + epsilon;
		case TEST_GREATER_THAN: return left > right - epsilon;
		case TEST_LESS_OR_EQUAL: return left <= right + epsilon;
		case TEST_GREATER_OR_EQUAL: return left >= right - epsilon;
		case TEST_XOR: return !!left && !right || !left && !!right;
		case TEST_OR: return !!left || !!right;
		case TEST_AND: return !!left && !!right;
		default: return false;
	}
}
/** `ParticleConditionBlock` — select one of two values from a scalar comparison. */
var particleConditionBlock = { build(block, ctx) {
	const test = typeof block.serialized.test === "number" ? block.serialized.test : TEST_EQUAL;
	const epsilon = typeof block.serialized.epsilon === "number" ? block.serialized.epsilon : 0;
	const left = ctx.input(block, "left", () => 0);
	const right = ctx.input(block, "right", () => 0);
	const ifTrue = ctx.input(block, "ifTrue", () => 1);
	const ifFalse = ctx.input(block, "ifFalse", () => 0);
	const getter = (i) => evaluate(test, left(i), right(i), epsilon) ? ifTrue(i) : ifFalse(i);
	ctx.setOutput(block.id, "output", getter);
} };
export { particleConditionBlock };

//# sourceMappingURL=particle-condition-block.js.map