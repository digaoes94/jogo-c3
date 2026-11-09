// src/particle/node/blocks/update-position-block.ts
/**
* `UpdatePositionBlock` — each step, writes the particle position columns from the `position` input
* (typically `currentPosition + scaledDirection`).
*/
var updatePositionBlock = { build(block, ctx) {
	const system = ctx.state.system;
	const buffer = ctx.state.buffer;
	if (!ctx.isConnected(block, "position")) return;
	const positionGetter = ctx.input(block, "position");
	const posX = buffer.posX;
	const posY = buffer.posY;
	const posZ = buffer.posZ;
	system.updateSteps.push((i) => {
		const v = positionGetter(i);
		posX[i] = v.x;
		posY[i] = v.y;
		posZ[i] = v.z;
	});
} };
export { updatePositionBlock };

//# sourceMappingURL=update-position-block.js.map