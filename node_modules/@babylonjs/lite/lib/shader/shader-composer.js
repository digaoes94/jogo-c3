import { computeUboLayout } from "./ubo-layout.js";
import { t as SCENE_UBO_WGSL } from "../_chunks/scene-uniforms-BGiGt-2G.js";
import { bindingExtension } from "./binding-extension.js";
// src/shader/shader-composer.ts
var STAGE_VERTEX = 1;
var STAGE_FRAGMENT = 2;
var VERTEX_SECTIONS = [
	"/*SU*/",
	"/*MU*/",
	"/*VI*/",
	"/*VO*/",
	"/*VD*/",
	"/*VP*/",
	"/*VH*/"
];
var FRAGMENT_SECTIONS = [
	"/*SU*/",
	"/*MU*/",
	"/*FI*/",
	"/*HF*/",
	"/*FB*/"
];
var MATERIAL_BINDING_GROUPS = ["mesh", "shadow"];
function replaceSections(template, markers, sections) {
	for (let index = 0; index < markers.length; index++) template = template.replace(markers[index], sections[index]);
	return template;
}
function topoSort(fragments) {
	const nodes = /* @__PURE__ */ new Map();
	for (const f of fragments) {
		if (nodes.has(f._id)) throw Error();
		nodes.set(f._id, {
			_fragment: f,
			_remaining: f._dependencies?.length ?? 0,
			_dependents: []
		});
	}
	for (const f of fragments) for (const d of f._dependencies ?? []) {
		const dependency = nodes.get(d);
		if (!dependency) throw Error();
		dependency._dependents.push(f._id);
	}
	const q = [];
	for (const [id, node] of nodes) if (node._remaining === 0) q.push(id);
	q.sort();
	const out = [];
	let qi = 0;
	while (qi < q.length) {
		const id = q[qi++];
		const node = nodes.get(id);
		out.push(node._fragment);
		for (const d of node._dependents) {
			const dependent = nodes.get(d);
			if (--dependent._remaining === 0) {
				let i = qi;
				while (i < q.length && q[i] < d) i++;
				q.splice(i, 0, d);
			}
		}
	}
	if (out.length !== fragments.length) throw Error();
	return out;
}
function dedup(base, extra) {
	const seen = /* @__PURE__ */ new Set();
	const all = [];
	for (const list of [base, extra]) for (const value of list) if (!seen.has(value._name)) {
		seen.add(value._name);
		all.push(value);
	}
	return all;
}
var SLOT_RE = /\/\*([A-Z_0-9]+)\*\//g;
function injectSlots(tpl, sorted, key) {
	return tpl.replace(SLOT_RE, (_, slot) => {
		const parts = [];
		for (const f of sorted) {
			const s = f[key];
			if (s?.[slot]) parts.push(s[slot]);
		}
		return parts.join("\n");
	});
}
function composeShader(template, fragments, meshVertexLayout) {
	const sorted = topoSort(fragments);
	const fragAttrs = [];
	const fragVaryings = [];
	const helpers = [];
	const vHelpers = [];
	const vBuiltins = [];
	for (const f of sorted) {
		if (f._vertexAttributes) fragAttrs.push(...f._vertexAttributes);
		if (f._varyings) fragVaryings.push(...f._varyings);
		if (f._helperFunctions) helpers.push(f._helperFunctions);
		if (f._vertexHelperFunctions) vHelpers.push(f._vertexHelperFunctions);
		for (const b of f._vertexBuiltins ?? []) vBuiltins.push(`@builtin(${b._builtin})${b._name}:${b._type},`);
	}
	const allAttrs = dedup(template._baseVertexAttributes, fragAttrs);
	const inputLines = [];
	const _vertexBufferLayouts = [];
	const groups = /* @__PURE__ */ new Map();
	for (let i = 0; i < allAttrs.length; i++) {
		const a = allAttrs[i];
		const meshLayout = a._stepMode !== "instance" ? meshVertexLayout?.[a._name] : void 0;
		inputLines.push(`@location(${i})${a._name}:${a._type},`);
		let layout = a._bufferGroup ? groups.get(a._bufferGroup) : void 0;
		if (!layout) {
			layout = {
				arrayStride: meshLayout?._stride ?? a._arrayStride,
				stepMode: a._stepMode ?? "vertex",
				attributes: []
			};
			if (a._bufferGroup) groups.set(a._bufferGroup, layout);
			else _vertexBufferLayouts.push(layout);
		}
		layout.attributes.push({
			shaderLocation: i,
			offset: meshLayout?._offset ?? a._offset ?? 0,
			format: a._gpuFormat
		});
	}
	for (const layout of groups.values()) _vertexBufferLayouts.push(layout);
	let nextLoc = allAttrs.length;
	for (const f of sorted) if (f._pipelineVertexBuffers) {
		const r = f._pipelineVertexBuffers(nextLoc);
		_vertexBufferLayouts.push(...r._buffers);
		nextLoc = r._nextLoc;
	}
	const varyBody = `@builtin(position)clipPos:vec4f,` + dedup(template._baseVaryings, fragVaryings).map((v, i) => `@location(${i})${v._name}:${v._type},`).join("\n");
	const hasMaterialUbo = !!(template._baseMaterialUboFields && template._baseMaterialUboFields.length > 0);
	const meshFields = [...template._baseMeshUboFields];
	const materialFields = hasMaterialUbo ? [...template._baseMaterialUboFields] : [];
	for (const f of sorted) if (f._uboFields?.length) (hasMaterialUbo ? materialFields : meshFields).push(...f._uboFields);
	const _meshUboSpec = computeUboLayout(meshFields);
	const _materialUboSpec = hasMaterialUbo ? computeUboLayout(materialFields) : void 0;
	const meshBGL = [{
		binding: 0,
		visibility: 3,
		buffer: { type: "uniform" }
	}];
	if (hasMaterialUbo) meshBGL.push({
		binding: 1,
		visibility: STAGE_FRAGMENT,
		buffer: { type: "uniform" }
	});
	const shadowBGL = [];
	const vDecls = [];
	const fDecls = [];
	let mb = hasMaterialUbo ? 2 : 1, sb = 0;
	function addBinding(d) {
		const isShadow = d._group === "shadow";
		const b = isShadow ? sb++ : mb++;
		const g = isShadow ? 2 : 1;
		const entry = {
			binding: b,
			visibility: d._visibility
		};
		const bindingType = d._type;
		let qualifier = "";
		let declarationType;
		if (bindingExtension) {
			const extension = bindingExtension(d, entry);
			if (extension) {
				qualifier = extension._qualifier;
				declarationType = extension._declarationType;
			}
		}
		switch (bindingType._kind) {
			case "uniform-buffer":
				entry.buffer = { type: "uniform" };
				qualifier = "<uniform>";
				declarationType = `${d._name}Uniforms`;
				break;
			case "texture": {
				const defaultSampleType = bindingType._textureType === "texture_depth_2d" ? "depth" : bindingType._textureType === "texture_2d<u32>" ? "uint" : "float";
				entry.texture = {
					sampleType: bindingType._sampleType ?? defaultSampleType,
					viewDimension: bindingType._textureType.includes("array") ? "2d-array" : bindingType._textureType.includes("cube") ? "cube" : "2d"
				};
				declarationType = bindingType._textureType;
				break;
			}
			case "sampler":
				entry.sampler = { type: bindingType._samplerType === "sampler_comparison" ? "comparison" : bindingType._samplerType === "sampler_non_filtering" ? "non-filtering" : "filtering" };
				declarationType = bindingType._samplerType === "sampler_non_filtering" ? "sampler" : bindingType._samplerType;
				break;
			case "storage-texture":
				entry.storageTexture = {
					access: bindingType._gpuAccess,
					format: bindingType._format
				};
				declarationType = `texture_storage_2d<${bindingType._format},${bindingType._access}>`;
		}
		(isShadow ? shadowBGL : meshBGL).push(entry);
		const w = `@group(${g})@binding(${b})var${qualifier} ${d._name}:${declarationType};`;
		if (d._visibility & STAGE_VERTEX) vDecls.push(w);
		if (d._visibility & STAGE_FRAGMENT) fDecls.push(w);
	}
	for (const d of template._baseVertexBindings ?? []) addBinding(d);
	for (const f of sorted) for (const d of f._vertexBindings ?? []) addBinding(d);
	for (const d of template._baseBindings ?? []) addBinding(d);
	for (const group of MATERIAL_BINDING_GROUPS) for (const f of sorted) for (const d of f._bindings ?? []) if ((d._group ?? "mesh") === group) addBinding(d);
	const _fragmentKey = sorted.map((f) => f._id).join("|");
	const vertexInputs = inputLines.join("\n");
	const vParams = (vBuiltins.length ? vBuiltins.join("\n") + "\n" : "") + vertexInputs;
	const meshStruct = `struct MeshUniforms{${_meshUboSpec._structBody}}`;
	const materialStruct = _materialUboSpec ? `struct MaterialUniforms{${_materialUboSpec._structBody}}@group(1)@binding(1)var<uniform>material:MaterialUniforms;` : "";
	let vertexWGSL = replaceSections(template._vertexTemplate, VERTEX_SECTIONS, [
		SCENE_UBO_WGSL,
		meshStruct,
		`struct VertexInput{${vertexInputs}}`,
		`struct VertexOutput{${varyBody}}`,
		vDecls.join("\n"),
		vParams,
		vHelpers.join("\n")
	]);
	vertexWGSL = injectSlots(vertexWGSL, sorted, "_vertexSlots");
	let fragmentWGSL = replaceSections(template._fragmentTemplate, FRAGMENT_SECTIONS, [
		SCENE_UBO_WGSL,
		meshStruct + materialStruct,
		`struct FragmentInput{${varyBody}}`,
		helpers.join("\n"),
		fDecls.join("\n")
	]);
	fragmentWGSL = injectSlots(fragmentWGSL, sorted, "_fragmentSlots");
	const _meshBGLDescriptor = { entries: meshBGL };
	const _shadowBGLDescriptor = shadowBGL.length ? { entries: shadowBGL } : null;
	return {
		_vertexWGSL: `${vertexWGSL}`,
		_fragmentWGSL: `${fragmentWGSL}`,
		_meshBGLDescriptor,
		_shadowBGLDescriptor,
		_vertexBufferLayouts,
		_meshUboSpec,
		_materialUboSpec,
		_fragmentKey
	};
}
export { composeShader };

//# sourceMappingURL=shader-composer.js.map