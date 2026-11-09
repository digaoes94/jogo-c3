// src/shadow/material-shadow-bindings.ts
/** @internal Loaded with receiver fragments, never by ordinary material builders. */
function createMaterialShadowBindings(engine, lights) {
	const cache = /* @__PURE__ */ new WeakMap();
	return (layout) => {
		let binding = cache.get(layout);
		if (!binding) {
			const entries = [];
			for (const { gen } of lights) entries.push({
				binding: entries.length,
				resource: gen._depthTexture.createView()
			}, {
				binding: entries.length + 1,
				resource: gen._depthSampler
			}, {
				binding: entries.length + 2,
				resource: { buffer: gen._shadowUBO }
			});
			binding = engine._device.createBindGroup({
				layout,
				entries
			});
			cache.set(layout, binding);
		}
		return binding;
	};
}
export { createMaterialShadowBindings };

//# sourceMappingURL=material-shadow-bindings.js.map