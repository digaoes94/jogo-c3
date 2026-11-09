// src/particle/node/blocks/update-size-block.ts
/** `UpdateSizeBlock` — write the evaluated size input into the size column each step. */
var updateSizeBlock = { build(block, ctx) {
	const system = ctx.state.system;
	const buffer = ctx.state.buffer;
	if (!ctx.isConnected(block, "size")) return;
	const sizeGetter = ctx.input(block, "size");
	const size = buffer.size;
	system.updateSteps.push((i) => {
		size[i] = sizeGetter(i);
	});
} };
export { updateSizeBlock };

//# sourceMappingURL=update-size-block.js.map