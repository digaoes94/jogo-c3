// src/particle/node/blocks/update-angle-block.ts
/** `UpdateAngleBlock` — write the evaluated rotation into the angle column. */
var updateAngleBlock = { build(block, ctx) {
	if (!ctx.isConnected(block, "angle")) return;
	const angleGetter = ctx.input(block, "angle");
	const angle = ctx.state.buffer.angle;
	ctx.state.system.updateSteps.push((i) => {
		angle[i] = angleGetter(i);
	});
} };
export { updateAngleBlock };

//# sourceMappingURL=update-angle-block.js.map