import { BU } from "../engine/gpu-flags.js";
import { registerManagedResourceDisposer } from "../resource/managed-resource-hooks.js";
// src/mesh/vertex-defaults.ts
/** @internal Constant zero defaults consume no per-vertex or per-slab-slot allocation. */
function _enableVertexDefaults(engine) {
	if (engine._getVertexDefaultBuffer) return;
	let buffer = null;
	let device;
	engine._getVertexDefaultBuffer = (gpu) => {
		if (gpu._vertexCount === void 0) return null;
		if (buffer && device === engine._device) return buffer;
		const next = engine._device.createBuffer({
			label: "mesh-zero-vertex",
			size: 16,
			usage: BU.VERTEX | BU.COPY_DST
		});
		if (buffer) buffer.destroy();
		else registerManagedResourceDisposer(engine, () => {
			buffer?.destroy();
			buffer = null;
		});
		buffer = next;
		device = engine._device;
		return next;
	};
}
export { _enableVertexDefaults };

//# sourceMappingURL=vertex-defaults.js.map