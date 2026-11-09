// src/particle/node/blocks/update-direction-block.ts
/** `UpdateDirectionBlock` — copy the evaluated velocity into the base direction columns. */
var updateDirectionBlock = { build(block, ctx) {
	if (!ctx.isConnected(block, "direction")) return;
	const buffer = ctx.state.buffer;
	const directionGetter = ctx.input(block, "direction");
	ctx.state.system.updateSteps.push((i) => {
		const direction = directionGetter(i);
		buffer.dirX[i] = direction.x;
		buffer.dirY[i] = direction.y;
		buffer.dirZ[i] = direction.z;
	});
} };
export { updateDirectionBlock };

//# sourceMappingURL=update-direction-block.js.map