import { lerpGetters } from "./particle-lerp-block.js";
// src/particle/node/blocks/particle-gradient-block.ts
/** `ParticleGradientBlock` — interpolate sorted static stops into reused scratch. */
var particleGradientBlock = { build(block, ctx) {
	const gradientGetter = ctx.input(block, "gradient", () => 1);
	const entries = block.inputs.filter((input) => input.name.startsWith("value") && input.targetBlockId != null).map((input) => ctx.input(block, input.name)(0)).sort((a, b) => a.reference - b.reference);
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
	const copy = (value) => {
		if (typeof value === "number") return value;
		if ("r" in value) {
			color4.r = value.r;
			color4.g = value.g;
			color4.b = value.b;
			color4.a = value.a;
			return color4;
		}
		if ("z" in value) {
			vector3.x = value.x;
			vector3.y = value.y;
			vector3.z = value.z;
			return vector3;
		}
		vector2.x = value.x;
		vector2.y = value.y;
		return vector2;
	};
	const getter = (i) => {
		const gradient = gradientGetter(i);
		if (entries.length === 1) return copy(entries[0].value(i));
		let next = null;
		for (let entryIndex = entries.length - 1; entryIndex >= 0; entryIndex--) {
			const entry = entries[entryIndex];
			if (entry.reference <= gradient) {
				if (next) {
					const amount = Math.max(0, Math.min(1, (gradient - entry.reference) / (next.reference - entry.reference)));
					return lerpGetters(entry.value, next.value, i, amount, vector2, vector3, color4);
				}
				return copy(entry.value(i));
			}
			next = entry;
		}
		return 0;
	};
	ctx.setOutput(block.id, "output", getter);
} };
export { particleGradientBlock };

//# sourceMappingURL=particle-gradient-block.js.map