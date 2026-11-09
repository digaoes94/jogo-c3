import { SS } from "../engine/gpu-flags.js";
import { createSingleUniformBGL } from "../shader/bgl-helpers.js";
import { getPickingSceneBGL } from "./picking-scene-bgl.js";
// src/picking/picking-detailed-pipeline.ts
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
function group2(engine, rule) {
	if (!rule.storage?.length) return null;
	return engine._device.createBindGroupLayout({
		label: `picking-discard-${rule.key}-bgl`,
		entries: rule.storage.map((_, binding) => ({
			binding,
			visibility: SS.FRAGMENT,
			buffer: { type: "read-only-storage" }
		}))
	});
}
function shader(rule, projection) {
	return `${`enable primitive_index;struct SceneUniforms{viewProjection:mat4x4f,fragmentCoord:vec2f}@group(0)@binding(0)var<uniform>scene:SceneUniforms;struct PickDiscardInput{worldPos:vec3f,fragmentCoord:vec2f,pickId:u32,thinInstanceIndex:u32,hasThinInstance:u32,instanceExtras:vec4f,}${rule?.storage?.map((s, binding) => `@group(2)@binding(${binding})var<storage,read> ${s.name}:${s.type};`).join("\n") ?? ""} ${rule?.wgsl ?? `fn shouldDiscardPick(input:PickDiscardInput)->bool{return false;}`} struct O{@builtin(position)p:vec4f,@location(0)@interpolate(flat)id:u32,@location(1)w:vec3f,@location(2)@interpolate(flat)ti:u32,@location(3)@interpolate(flat)hasTi:u32,@location(4)@interpolate(flat)extras:vec4f,@location(5)local:vec3f,}struct F{@location(0)color:vec4f,@location(1)depth:f32,@location(2)detail:vec4u}@fragment fn fs(i:O,@builtin(primitive_index)primitiveIndex:u32)->F{if(shouldDiscardPick(PickDiscardInput(i.w,scene.fragmentCoord,i.id,i.ti,i.hasTi,i.extras))){discard;}let r=f32((i.id>>16u)&255u)/255.0;let g=f32((i.id>>8u)&255u)/255.0;let b=f32(i.id&255u)/255.0;return F(vec4f(r,g,b,1),i.p.z,vec4u(primitiveIndex,bitcast<u32>(i.local.x),bitcast<u32>(i.local.y),bitcast<u32>(i.local.z)));}`} ${projection?.regularDeclarations ?? ""} struct M{world:mat4x4f,pickId:u32}@group(1)@binding(0)var<uniform>mesh:M;@vertex fn vs(@location(0)position:vec3f${projection?.regularInputs ?? ""})->O{var o:O;${projection ? `${projection.regularBody} let w=projectedWorld;` : "let w = (mesh.world * vec4f(position, 1)).xyz;"} o.p=scene.viewProjection*vec4f(w,1);o.id=mesh.pickId;o.w=w;o.ti=0xffffffffu;o.hasTi=0u;o.extras=vec4f(0);o.local=position;return o;}`;
}
var POSITION = {
	arrayStride: 12,
	attributes: [{
		shaderLocation: 0,
		offset: 0,
		format: "float32x3"
	}]
};
function create(engine, rule, discardBGL, label, projection) {
	const device = engine._device;
	const module = device.createShaderModule({
		label: `${label}-shader`,
		code: shader(rule, projection?.shader ?? null)
	});
	const bgl1 = meshBGL(engine);
	const base = discardBGL ? [
		getPickingSceneBGL(engine),
		bgl1,
		discardBGL
	] : [getPickingSceneBGL(engine), bgl1];
	return device.createRenderPipeline({
		label: `${label}-pipeline`,
		layout: device.createPipelineLayout({ bindGroupLayouts: projection?._layouts?.(engine, base) ?? base }),
		vertex: {
			module,
			entryPoint: "vs",
			buffers: projection?._buffers ?? [POSITION]
		},
		fragment: {
			module,
			entryPoint: "fs",
			targets: [
				{ format: "rgba8unorm" },
				{ format: "r32float" },
				{ format: "rgba32uint" }
			]
		},
		depthStencil: {
			format: "depth24plus",
			depthCompare: "greater",
			depthWriteEnabled: true
		},
		primitive: {
			topology: "triangle-list",
			cullMode: "none"
		}
	});
}
function getPickingPipelineSet(engine, rule, projection = null) {
	invalidate(engine);
	const key = `${rule ? rule.key : "default"}:${projection?.key ?? "affine"}`;
	const sets = _sets ??= /* @__PURE__ */ new Map();
	const cached = sets.get(key);
	if (cached) return cached;
	const active = rule ?? null;
	const discardBGL = active ? group2(engine, active) : null;
	const regularPipeline = create(engine, active, discardBGL, active ? `picking-${active.key}-detailed` : "picking-detailed", projection);
	const set = {
		regularPipeline,
		thinInstancePipeline: regularPipeline,
		discardBGL,
		detailed: true
	};
	sets.set(key, set);
	return set;
}
export { getPickingPipelineSet };

//# sourceMappingURL=picking-detailed-pipeline.js.map