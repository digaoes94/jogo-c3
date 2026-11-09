import { SS } from "../engine/gpu-flags.js";
import "../engine/render-target.js";
import { _rightHanded } from "#coordinate-system";
// src/render/scene-helpers.ts
/** Scene helpers — shared utilities for renderable builders.
*
*  Centralises patterns that PBR and Standard pipelines previously duplicated:
*  scene BGL creation, mesh world-matrix updates, and pipeline descriptors. */
var _sceneLayouts = null;
/** Shared scene bind group layout:
*  binding 0: per-pass SceneUniforms UBO
*  binding 1: scene-owned LightsUniforms UBO */
function getSceneBindGroupLayout(engine) {
	const device = engine._device;
	const layouts = _sceneLayouts ??= /* @__PURE__ */ new WeakMap();
	let layout = layouts.get(device);
	if (!layout) {
		layout = device.createBindGroupLayout({
			label: "scene",
			entries: [{
				binding: 0,
				visibility: SS.VERTEX | SS.FRAGMENT,
				buffer: { type: "uniform" }
			}, {
				binding: 1,
				visibility: SS.FRAGMENT,
				buffer: { type: "uniform" }
			}]
		});
		layouts.set(device, layout);
	}
	return layout;
}
/** Clear all cached scene layouts. Device replacement requires no explicit invalidation. */
function clearSceneBGLCache() {
	_sceneLayouts = null;
}
/** Write world matrices to UBOs for packets whose version has changed. */
function updateWorldMatrixUBOs(engine, packets) {
	const device = engine._device;
	for (const p of packets) {
		const wm = p.mesh.worldMatrix;
		if (p.mesh.worldMatrixVersion !== p._lastWorldVersion) {
			device.queue.writeBuffer(p.meshUBO, 0, wm);
			p._lastWorldVersion = p.mesh.worldMatrixVersion;
		}
	}
}
/** Build a render pipeline descriptor with the engine's default reverse-Z state:
*  depth24plus-stencil8, greater-equal, triangle-list, ccw front face. */
function createDefaultPipelineDescriptor(opts) {
	const target = opts._blend ? {
		format: opts._format,
		blend: opts._blend
	} : { format: opts._format };
	return {
		label: opts._label,
		layout: opts._engine._device.createPipelineLayout({ bindGroupLayouts: opts._bgls }),
		vertex: {
			module: opts._vertModule,
			entryPoint: "main",
			buffers: opts._vertexBuffers
		},
		fragment: {
			module: opts._fragModule,
			entryPoint: "main",
			targets: [target]
		},
		depthStencil: {
			format: opts._depthStencilFormat ?? "depth24plus-stencil8",
			depthCompare: opts._depthCompare ?? "greater-equal",
			depthWriteEnabled: opts._depthWriteEnabled ?? true
		},
		multisample: { count: opts._msaaSamples },
		primitive: {
			topology: "triangle-list",
			cullMode: opts._cullMode ?? "back",
			frontFace: _rightHanded ? "cw" : "ccw"
		}
	};
}
export { clearSceneBGLCache, createDefaultPipelineDescriptor, getSceneBindGroupLayout, updateWorldMatrixUBOs };

//# sourceMappingURL=scene-helpers.js.map