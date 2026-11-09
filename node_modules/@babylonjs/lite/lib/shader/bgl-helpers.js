// src/shader/bgl-helpers.ts
/** Create a BGL with a single `uniform` buffer entry at binding 0.
*  Used for scene/mesh/skybox UBOs that only bind one uniform buffer. */
function createSingleUniformBGL(engine, label, visibility) {
	return engine._device.createBindGroupLayout({
		label,
		entries: [{
			binding: 0,
			visibility,
			buffer: { type: "uniform" }
		}]
	});
}
export { createSingleUniformBGL };

//# sourceMappingURL=bgl-helpers.js.map