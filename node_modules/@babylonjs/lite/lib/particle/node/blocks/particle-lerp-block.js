// src/particle/node/blocks/particle-lerp-block.ts
/** Interpolate two lazy values into caller-owned scratch, copying the left before reading the right. */
function lerpGetters(left, right, i, amount, vector2, vector3, color4) {
	const start = left(i);
	if (typeof start === "number") {
		const end = right(i);
		return start + ((typeof end === "number" ? end : 0) - start) * amount;
	}
	if ("r" in start) {
		const startR = start.r;
		const startG = start.g;
		const startB = start.b;
		const startA = start.a;
		const end = right(i);
		const endColor = typeof end !== "number" && "r" in end ? end : null;
		color4.r = startR + ((endColor?.r ?? 0) - startR) * amount;
		color4.g = startG + ((endColor?.g ?? 0) - startG) * amount;
		color4.b = startB + ((endColor?.b ?? 0) - startB) * amount;
		color4.a = startA + ((endColor?.a ?? 0) - startA) * amount;
		return color4;
	}
	if ("z" in start) {
		const startX = start.x;
		const startY = start.y;
		const startZ = start.z;
		const end = right(i);
		const endVector = typeof end !== "number" && "z" in end ? end : null;
		vector3.x = startX + ((endVector?.x ?? 0) - startX) * amount;
		vector3.y = startY + ((endVector?.y ?? 0) - startY) * amount;
		vector3.z = startZ + ((endVector?.z ?? 0) - startZ) * amount;
		return vector3;
	}
	const startX = start.x;
	const startY = start.y;
	const end = right(i);
	const endVector = typeof end !== "number" && !("r" in end) && !("z" in end) ? end : null;
	vector2.x = startX + ((endVector?.x ?? 0) - startX) * amount;
	vector2.y = startY + ((endVector?.y ?? 0) - startY) * amount;
	return vector2;
}
/** `ParticleLerpBlock` — component-wise linear interpolation `left + (right - left) * gradient`, into scratch. */
var particleLerpBlock = { build(block, ctx) {
	const left = ctx.input(block, "left");
	const right = ctx.input(block, "right");
	const gradient = ctx.input(block, "gradient", () => 0);
	const v3 = {
		x: 0,
		y: 0,
		z: 0
	};
	const c4 = {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	};
	const v2 = {
		x: 0,
		y: 0
	};
	const getter = (i) => {
		const g = gradient(i);
		return lerpGetters(left, right, i, typeof g === "number" ? g : 0, v2, v3, c4);
	};
	ctx.setOutput(block.id, "output", getter);
} };
export { lerpGetters, particleLerpBlock };

//# sourceMappingURL=particle-lerp-block.js.map