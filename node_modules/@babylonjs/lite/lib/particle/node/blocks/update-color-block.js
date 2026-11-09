// src/particle/node/blocks/update-color-block.ts
/**
* `UpdateColorBlock` — each step, writes the particle colour columns from the `color` input
* (typically `currentColour + scaledColorStep`).
*/
var updateColorBlock = { build(block, ctx) {
	const system = ctx.state.system;
	const buffer = ctx.state.buffer;
	if (!ctx.isConnected(block, "color")) return;
	const colorGetter = ctx.input(block, "color");
	const colR = buffer.colorR;
	const colG = buffer.colorG;
	const colB = buffer.colorB;
	const colA = buffer.colorA;
	system.updateSteps.push((i) => {
		const c = colorGetter(i);
		colR[i] = c.r;
		colG[i] = c.g;
		colB[i] = c.b;
		colA[i] = c.a;
	});
} };
export { updateColorBlock };

//# sourceMappingURL=update-color-block.js.map