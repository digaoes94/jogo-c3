import { SS } from "../engine/gpu-flags.js";
import { createSingleUniformBGL } from "../shader/bgl-helpers.js";
import { getPickingSceneBGL } from "./picking-scene-bgl.js";
import { pickingShaderSource } from "./picking-shader.js";
// src/picking/picking-pipeline.ts
/** Basic position-only picking pipelines. */
var _device = null;
var _meshBGL = null;
var _sets = null;
function invalidate(engine) {
	if (_device === engine._device) return;
	_device = engine._device;
	_meshBGL = null;
	_sets = null;
}
function meshBGL(engine) {
	invalidate(engine);
	return _meshBGL ??= createSingleUniformBGL(engine, "picking-mesh-bgl", SS.VERTEX | SS.FRAGMENT);
}
function discardBGL(engine, discard) {
	return engine._device.createBindGroupLayout({
		label: `picking-discard-${discard.key}-bgl`,
		entries: (discard.storage ?? []).map((_, binding) => ({
			binding,
			visibility: SS.FRAGMENT,
			buffer: { type: "read-only-storage" }
		}))
	});
}
var POSITION = {
	arrayStride: 12,
	attributes: [{
		shaderLocation: 0,
		offset: 0,
		format: "float32x3"
	}]
};
function pipeline(engine, discard, group2, label, projection) {
	const device = engine._device;
	const module = device.createShaderModule({
		label: `${label}-shader`,
		code: pickingShaderSource({
			discardWgsl: discard?.wgsl,
			storage: discard?.storage,
			_vertexProjection: projection?.shader
		})
	});
	const group1 = meshBGL(engine);
	const base = group2 ? [
		getPickingSceneBGL(engine),
		group1,
		group2
	] : [getPickingSceneBGL(engine), group1];
	const layout = device.createPipelineLayout({
		label: `${label}-pipeline-layout`,
		bindGroupLayouts: projection?._layouts?.(engine, base) ?? base
	});
	return device.createRenderPipeline({
		label: `${label}-pipeline`,
		layout,
		vertex: {
			module,
			entryPoint: "vs",
			buffers: projection?._buffers ?? [POSITION]
		},
		fragment: {
			module,
			entryPoint: "fs",
			targets: [{ format: "rgba8unorm" }, { format: "r32float" }]
		},
		depthStencil: {
			format: "depth24plus",
			depthCompare: "greater",
			depthWriteEnabled: true
		},
		primitive: {
			topology: "triangle-list",
			cullMode: "none"
		},
		multisample: { count: 1 }
	});
}
function getPickingPipelineSet(engine, discard, projection = null) {
	invalidate(engine);
	const key = `${discard ? `discard:${discard.key}` : "default"}:${projection?.key ?? "affine"}`;
	const sets = _sets ??= /* @__PURE__ */ new Map();
	const cached = sets.get(key);
	if (cached) return cached;
	const active = discard ?? null;
	const group2 = active?.storage?.length ? discardBGL(engine, active) : null;
	const regularPipeline = pipeline(engine, active, group2, active ? `picking-${active.key}` : "picking", projection);
	const set = {
		regularPipeline,
		thinInstancePipeline: regularPipeline,
		discardBGL: group2
	};
	sets.set(key, set);
	return set;
}
export { getPickingPipelineSet };

//# sourceMappingURL=picking-pipeline.js.map