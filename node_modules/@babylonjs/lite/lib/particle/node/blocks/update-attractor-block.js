// src/particle/node/blocks/update-attractor-block.ts
/** `UpdateAttractorBlock` — apply a softened inverse-square force to particle direction. */
var updateAttractorBlock = { build(block, ctx) {
	const system = ctx.state.system;
	const buffer = ctx.state.buffer;
	const defaultAttractor = {
		x: 0,
		y: 0,
		z: 0
	};
	const attractorGetter = ctx.input(block, "attractor", () => defaultAttractor);
	const strengthGetter = ctx.input(block, "strength", () => 1);
	system.updateSteps.push((i) => {
		const attractor = attractorGetter(i);
		const attractorX = attractor.x;
		const attractorY = attractor.y;
		const attractorZ = attractor.z;
		const strength = strengthGetter(i);
		const offsetX = attractorX - buffer.posX[i];
		const offsetY = attractorY - buffer.posY[i];
		const offsetZ = attractorZ - buffer.posZ[i];
		const lengthSquared = offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ;
		if (lengthSquared === 0) return;
		const scale = strength * system._scaledStep / ((lengthSquared + 1) * Math.sqrt(lengthSquared));
		buffer.dirX[i] = buffer.dirX[i] + offsetX * scale;
		buffer.dirY[i] = buffer.dirY[i] + offsetY * scale;
		buffer.dirZ[i] = buffer.dirZ[i] + offsetZ * scale;
	});
} };
export { updateAttractorBlock };

//# sourceMappingURL=update-attractor-block.js.map